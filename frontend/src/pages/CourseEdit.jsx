import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TeachingApi, FullApi, UsersApi } from "../api";

export default function CourseEdit() {
  const { courseId: courseIdFromParams } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [categories, setCategories] = useState([]);
  const [tests, setTests] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Формы верхнего уровня
  const [showAddModuleForm, setShowAddModuleForm] = useState(false);
  const [showAddGlobalTestForm, setShowAddGlobalTestForm] = useState(false);
  const [newModule, setNewModule] = useState({ name: "", description: "" });
  const [newGlobalTest, setNewGlobalTest] = useState({ name: "", description: "", duration: "10" });

  // Формы внутри модулей
  const [openTopicForms, setOpenTopicForms] = useState({});
  const [openTestForms, setOpenTestForms] = useState({});
  const [newTopics, setNewTopics] = useState({});
  const [newTests, setNewTests] = useState({});
  
  // Состояние для загрузки файлов материалов темы
  const [newContentFiles, setNewContentFiles] = useState({}); // { topicId: { file: File, description: "" } }
  const [showAddContentForm, setShowAddContentForm] = useState({}); // { topicId: boolean }

  useEffect(() => {
    const id = Number(courseIdFromParams);
    if (isNaN(id)) {
      console.error("Некорректный ID курса");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      const token = localStorage.getItem("jwtToken");
      const teachingApi = new TeachingApi();
      const fullApi = new FullApi();
      const usersApi = new UsersApi();

      if (token) {
        teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
        fullApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
        usersApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
      }

      try {
        const [userData, courseData, cats] = await Promise.all([
          usersApi.meUsersMeGet(),
          teachingApi.getCourseFullCoursesCourseIdGet(id),
          fullApi.listCategoriesFullAdminCategoriesGet({})
        ]);

        setCurrentUserId(userData.id);
        setCategories(cats || []);
        setCourse(courseData);
        setImagePreview(null);
      } catch (err) {
        console.error("Ошибка инициализации:", err);
        setLoading(false);
        return;
      }

      try {
        const globalTestsData = await teachingApi.listTestsFullTestsGet({ courseId: id });
        const globalTests = (globalTestsData || []).map(t => ({ ...t, _source: 'global' }));

        const modulesData = await teachingApi.listModulesForCourseFullCoursesCourseIdModulesGet(id);

        const modulePromises = (modulesData || []).map(async (module) => {
          const moduleTestsData = await teachingApi.listTestsFullTestsGet({ moduleId: module.id }).catch(() => []);
          const moduleTests = (moduleTestsData || []).map(t => ({
            ...t,
            _source: 'module',
            _moduleId: module.id
          }));

          try {
            const topicsData = await teachingApi.listTopicsFullCoursesCourseIdModulesModuleIdTopicsGet(
              Number(courseIdFromParams),
              module.id
            );

            const contentsPromises = (topicsData || []).map(async (topic) => {
              try {
                const contentData = await teachingApi.getTopicContentsFullTopicsTopicIdContentsGet(
                  topic.id,
                  { courseId: Number(courseIdFromParams) }
                );
                return { ...topic, contents: contentData || [] };
              } catch (contentErr) {
                console.error("Ошибка загрузки материалов темы:", contentErr);
                return { ...topic, contents: [] };
              }
            });

            const topicsWithContents = await Promise.all(contentsPromises);
            return {
              ...module,
              _tests: moduleTests,
              topics: topicsWithContents
            };
          } catch (topicErr) {
            console.error("Ошибка загрузки тем модуля:", topicErr);
            return {
              ...module,
              _tests: moduleTests,
              topics: []
            };
          }
        });

        const modulesWithTestsAndTopics = await Promise.all(modulePromises);
        const allModuleTests = modulesWithTestsAndTopics.flatMap(m => m._tests || []);
        const allTests = [...globalTests, ...allModuleTests];

        setCourse(prev => ({ ...prev, modules: modulesWithTestsAndTopics }));
        setTests(allTests);
      } catch (err) {
        console.error("Ошибка загрузки модулей/тестов:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseIdFromParams]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCourseChange = (field, value) => {
    setCourse((prev) => ({ ...prev, [field]: value }));
  };

  const handleTopicChange = (moduleId, topicId, field, value) => {
    setCourse((prev) => ({
      ...prev,
      modules: prev.modules.map((mod) =>
        mod.id === moduleId
          ? {
              ...mod,
              topics: mod.topics.map((t) =>
                t.id === topicId ? { ...t, [field]: value } : t
              ),
            }
          : mod
      ),
    }));
  };

  const handleTopicContentChange = (moduleId, topicId, contentId, field, value) => {
    setCourse((prev) => ({
      ...prev,
      modules: prev.modules.map((mod) =>
        mod.id === moduleId
          ? {
              ...mod,
              topics: mod.topics.map((t) =>
                t.id === topicId
                  ? {
                      ...t,
                      contents: t.contents.map((c) =>
                        c.id === contentId ? { ...c, [field]: value } : c
                      ),
                    }
                  : t
              ),
            }
          : mod
      ),
    }));
  };

  // --- Обработчики создания ---
  const handleCreateModule = async () => {
    if (!newModule.name.trim()) {
      alert("Название модуля обязательно");
      return;
    }

    const token = localStorage.getItem("jwtToken");
    const teachingApi = new TeachingApi();
    if (token) {
      teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
      const data = await teachingApi.createModuleFullModulesPost({
        name: newModule.name.trim(),
        description: newModule.description || "",
        courseId: Number(courseIdFromParams),
      });
      setCourse((prev) => ({
        ...prev,
        modules: [...(prev.modules || []), { ...data, topics: [], _tests: [] }],
      }));
      setNewModule({ name: "", description: "" });
      setShowAddModuleForm(false);
      alert("Модуль создан!");
    } catch (err) {
      console.error("Ошибка создания модуля:", err);
      alert("Не удалось создать модуль");
    }
  };

  const handleCreateTopic = async (moduleId) => {
    const topicData = newTopics[moduleId] || { name: "", description: "" };
    if (!topicData.name?.trim()) {
      alert("Название темы обязательно");
      return;
    }

    const token = localStorage.getItem("jwtToken");
    const teachingApi = new TeachingApi();
    if (token) {
      teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
      const data = await teachingApi.createTopicFullTopicsPost({
        name: topicData.name.trim(),
        description: topicData.description || "",
        moduleId: moduleId,
      });
      setCourse((prev) => ({
        ...prev,
        modules: prev.modules.map((mod) =>
          mod.id === moduleId ? { ...mod, topics: [...(mod.topics || []), { ...data, contents: [] }] } : mod
        ),
      }));
      setNewTopics((prev) => ({ ...prev, [moduleId]: { name: "", description: "" } }));
      setOpenTopicForms((prev) => ({ ...prev, [moduleId]: false }));
      alert("Тема создана!");
    } catch (err) {
      console.error("Ошибка создания темы:", err);
      alert("Не удалось создать тему");
    }
  };

  const handleCreateTest = async (moduleId = null) => {
    const testData = moduleId ? newTests[moduleId] : newGlobalTest;
    if (!testData.name?.trim()) {
      alert("Название теста обязательно");
      return;
    }

    const token = localStorage.getItem("jwtToken");
    const teachingApi = new TeachingApi();
    if (token) {
      teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    const courseId = Number(courseIdFromParams);
    const testCreate = {
      name: testData.name.trim(),
      description: testData.description || "",
      durationInMinutes: Number(testData.duration) || 10,
    };
    if (moduleId) {
      testCreate.moduleId = moduleId;
    } else {
      testCreate.courseId = courseId;
    }

    try {
      const data = await teachingApi.createTestFullTestsPost(testCreate);
      const newTest = { ...data, _source: moduleId ? 'module' : 'global', _moduleId: moduleId };
      setTests(prev => [...prev, newTest]);
      if (moduleId) {
        setNewTests((prev) => ({ ...prev, [moduleId]: { name: "", description: "", duration: "10" } }));
        setOpenTestForms((prev) => ({ ...prev, [moduleId]: false }));
        setCourse(prev => ({
          ...prev,
          modules: prev.modules.map(mod =>
            mod.id === moduleId ? { ...mod, _tests: [...(mod._tests || []), newTest] } : mod
          )
        }));
      } else {
        setNewGlobalTest({ name: "", description: "", duration: "10" });
        setShowAddGlobalTestForm(false);
      }
      alert("Тест создан!");
    } catch (err) {
      console.error("Ошибка создания теста:", err);
      alert("Не удалось создать тест");
    }
  };

  const handleSave = async () => {
    if (!course || currentUserId === null) return;

    const id = Number(courseIdFromParams);
    if (isNaN(id)) return;

    const name = (course.name || "").trim();
    const categoryId = course.categoryId ? Number(course.categoryId) : null;

    if (!name || !categoryId || categoryId <= 0) {
      alert("Заполните название и выберите категорию");
      return;
    }

    const token = localStorage.getItem("jwtToken");
    const teachingApi = new TeachingApi();

    if (token) {
      teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
      // 1. Обновляем курс (с обязательными полями authorId и picture)
      await teachingApi.updateCourseFullCoursesCourseIdPut(id, {
        name,
        description: course.description || "",
        categoryId,
        authorId: currentUserId, // Используем ID текущего пользователя
        picture: course.picture || null, // Используем текущую картинку или null
      });

      // 2. Загружаем картинку, если выбран файл
      if (selectedFile) {
        await teachingApi.uploadCoursePictureFullCoursesCourseIdPicturePost(id, selectedFile);
        // Очищаем выбранный файл после успешной загрузки
        setSelectedFile(null);
        setImagePreview(null);
      }

      // 3. Сохраняем модули
      const modulePromises = (course.modules || []).map((module) =>
        teachingApi.updateModuleFullModulesModuleIdPut(
          module.id,
          { name: module.name, description: module.description, courseId: id }
        )
      );
      await Promise.all(modulePromises);

      // 4. Сохраняем темы
      const topicPromises = [];
      (course.modules || []).forEach((mod) => {
        (mod.topics || []).forEach((topic) => {
          topicPromises.push(
            teachingApi.updateTopicFullTopicsTopicIdPut(
              topic.id,
              { name: topic.name, description: topic.description, moduleId: mod.id }
            )
          );
        });
      });
      await Promise.all(topicPromises);

      // 5. Сохраняем материалы тем
      const contentPromises = [];
      (course.modules || []).forEach((mod) => {
        (mod.topics || []).forEach((topic) => {
          (topic.contents || []).forEach((content) => {
            contentPromises.push(
              teachingApi.updateTopicContentFullTopicContentsContentIdPut(
                content.id,
                { 
                  description: content.description || "", 
                  topicId: topic.id,
                  file: content.file || "" // Добавляем обязательное поле file
                }
              )
            );
          });
        });
      });
      await Promise.all(contentPromises);

      alert("Курс успешно сохранён!");
    } catch (error) {
      console.error("Ошибка при сохранении данных:", error);
      alert("Не все данные сохранены. Проверьте консоль.");
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (!course) return <div className="error">Курс не найден</div>;

  const toggleTopicForm = (moduleId) => {
    setOpenTopicForms((prev) => {
      const newState = { ...prev, [moduleId]: !prev[moduleId] };
      if (newState[moduleId]) {
        setNewTopics((prevTopics) => ({
          ...prevTopics,
          [moduleId]: { name: "", description: "" }
        }));
      }
      return newState;
    });
  };

  const toggleTestForm = (moduleId) => {
    setOpenTestForms((prev) => {
      const newState = { ...prev, [moduleId]: !prev[moduleId] };
      if (newState[moduleId]) {
        setNewTests((prevTests) => ({
          ...prevTests,
          [moduleId]: { name: "", description: "", duration: "10" }
        }));
      }
      return newState;
    });
  };

  // Обработчик выбора файла для материала темы
  const handleContentFileChange = (topicId, e) => {
    const file = e.target.files[0];
    if (file) {
      setNewContentFiles((prev) => ({
        ...prev,
        [topicId]: { ...prev[topicId], file }
      }));
    }
  };

  // Обработчик изменения описания нового материала темы
  const handleNewContentDescriptionChange = (topicId, value) => {
    setNewContentFiles((prev) => ({
      ...prev,
      [topicId]: { ...prev[topicId], description: value || "" }
    }));
  };

  // Обработчик создания нового материала темы
  const handleCreateTopicContent = async (moduleId, topicId) => {
    const contentData = newContentFiles[topicId];
    if (!contentData || !contentData.file) {
      alert("Выберите файл для загрузки");
      return;
    }

    const token = localStorage.getItem("jwtToken");
    const teachingApi = new TeachingApi();
    if (token) {
      teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
      const data = await teachingApi.createTopicContentFullTopicContentsPost(topicId, {
        file: contentData.file,
        description: contentData.description || ""
      });

      // Добавляем новый материал в состояние
      setCourse((prev) => ({
        ...prev,
        modules: prev.modules.map((mod) =>
          mod.id === moduleId
            ? {
                ...mod,
                topics: mod.topics.map((t) =>
                  t.id === topicId
                    ? { ...t, contents: [...(t.contents || []), data] }
                    : t
                ),
              }
            : mod
        ),
      }));

      // Очищаем форму
      setNewContentFiles((prev) => {
        const newState = { ...prev };
        delete newState[topicId];
        return newState;
      });
      setShowAddContentForm((prev) => ({ ...prev, [topicId]: false }));
      alert("Материал успешно загружен!");
    } catch (err) {
      console.error("Ошибка загрузки материала:", err);
      alert("Не удалось загрузить материал");
    }
  };

  // Обработчик удаления материала темы
  const handleDeleteTopicContent = async (moduleId, topicId, contentId) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот материал?")) {
      return;
    }

    const token = localStorage.getItem("jwtToken");
    const teachingApi = new TeachingApi();
    if (token) {
      teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
      await teachingApi.deleteTopicContentFullTopicContentsContentIdDelete(contentId);

      // Удаляем материал из состояния
      setCourse((prev) => ({
        ...prev,
        modules: prev.modules.map((mod) =>
          mod.id === moduleId
            ? {
                ...mod,
                topics: mod.topics.map((t) =>
                  t.id === topicId
                    ? {
                        ...t,
                        contents: (t.contents || []).filter((c) => c.id !== contentId)
                      }
                    : t
                ),
              }
            : mod
        ),
      }));

      alert("Материал удалён!");
    } catch (err) {
      console.error("Ошибка удаления материала:", err);
      alert("Не удалось удалить материал");
    }
  };

  // Обработчик скачивания материала темы
  const handleDownloadTopicContent = async (contentId) => {
    const token = localStorage.getItem("jwtToken");
    const teachingApi = new TeachingApi();
    if (token) {
      teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
      // Получаем URL для скачивания
      const url = `${teachingApi.apiClient.basePath}/full/topic-contents/${contentId}/download`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `material_${contentId}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      } else {
        alert("Не удалось скачать файл");
      }
    } catch (err) {
      console.error("Ошибка скачивания материала:", err);
      alert("Не удалось скачать файл");
    }
  };

  // Удаление модуля
  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот модуль? Все темы, материалы и тесты также будут удалены.")) {
      return;
    }

    const token = localStorage.getItem("jwtToken");
    const teachingApi = new TeachingApi();
    if (token) {
      teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
      await teachingApi.deleteModuleFullModulesModuleIdDelete(moduleId);
      setCourse((prev) => ({
        ...prev,
        modules: (prev.modules || []).filter((m) => m.id !== moduleId)
      }));
      // Также удаляем тесты модуля из общего списка
      setTests((prev) => prev.filter((t) => t._moduleId !== moduleId));
      alert("Модуль удалён!");
    } catch (err) {
      console.error("Ошибка удаления модуля:", err);
      alert("Не удалось удалить модуль");
    }
  };

  // Удаление темы
  const handleDeleteTopic = async (moduleId, topicId) => {
    if (!window.confirm("Вы уверены, что хотите удалить эту тему? Все материалы также будут удалены.")) {
      return;
    }

    const token = localStorage.getItem("jwtToken");
    const teachingApi = new TeachingApi();
    if (token) {
      teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
      await teachingApi.deleteTopicFullTopicsTopicIdDelete(topicId);
      setCourse((prev) => ({
        ...prev,
        modules: prev.modules.map((mod) =>
          mod.id === moduleId
            ? { ...mod, topics: (mod.topics || []).filter((t) => t.id !== topicId) }
            : mod
        )
      }));
      alert("Тема удалена!");
    } catch (err) {
      console.error("Ошибка удаления темы:", err);
      alert("Не удалось удалить тему");
    }
  };

  // Удаление теста
  const handleDeleteTest = async (testId, isGlobal = false) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот тест? Все вопросы и ответы также будут удалены.")) {
      return;
    }

    const token = localStorage.getItem("jwtToken");
    const teachingApi = new TeachingApi();
    if (token) {
      teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
      await teachingApi.deleteTestFullTestsTestIdDelete(testId);
      
      // Удаляем из общего списка тестов
      setTests((prev) => prev.filter((t) => t.id !== testId));
      
      // Если тест модуля, удаляем из модуля
      if (!isGlobal) {
        setCourse((prev) => ({
          ...prev,
          modules: prev.modules.map((mod) => ({
            ...mod,
            _tests: (mod._tests || []).filter((t) => t.id !== testId)
          }))
        }));
      }
      
      alert("Тест удалён!");
    } catch (err) {
      console.error("Ошибка удаления теста:", err);
      alert("Не удалось удалить тест");
    }
  };

  return (
    <div className="course-edit-layout">
      <aside className="course-sidebar">
        <div className="course-card">
          <div
            className="image-wrapper"
            onClick={() => document.getElementById("fileInput").click()}
          >
            <img
              src={
                imagePreview
                  ? imagePreview
                  : `http://localhost:8000/full/courses/${courseIdFromParams}/picture`
              }
              alt={course.name}
              className="course-cover"
              onError={(e) => (e.target.src = "/default.png")}
            />
            <div className="overlay">Выбрать...</div>
            <input
              type="file"
              id="fileInput"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>

          <div className="course-card-fields">
            <label>
              Название курса:
              <input
                type="text"
                value={course.name || ""}
                onChange={(e) => handleCourseChange("name", e.target.value)}
              />
            </label>

            <label>
              Категория:
              <select
                value={course.categoryId || ""}
                onChange={(e) =>
                  handleCourseChange("categoryId", Number(e.target.value))
                }
              >
                <option value="">Выберите категорию</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Описание:
              <textarea
                rows="3"
                value={course.description || ""}
                onChange={(e) => handleCourseChange("description", e.target.value)}
              />
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={course.isPublished || false}
                onChange={(e) =>
                  handleCourseChange("isPublished", e.target.checked)
                }
              />
              Опубликован
            </label>
          </div>
        </div>
      </aside>

      <main className="course-content">
        <h2>Редактирование курса: {course.name}</h2>

        <div className="add-module-section">
          <button
            type="button"
            className="add-btn"
            onClick={() => setShowAddModuleForm(!showAddModuleForm)}
          >
            + Добавить модуль
          </button>

          {showAddModuleForm && (
            <div className="add-module-form">
              <h4>Новый модуль</h4>
              <label>
                Название модуля:
                <input
                  type="text"
                  className="form-input"
                  placeholder="Введите название"
                  value={newModule.name}
                  onChange={(e) => setNewModule({ ...newModule, name: e.target.value })}
                />
              </label>
              <label>
                Описание (опционально):
                <textarea
                  className="form-input"
                  rows="2"
                  placeholder="Описание модуля"
                  value={newModule.description}
                  onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                ></textarea>
              </label>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowAddModuleForm(false);
                    setNewModule({ name: "", description: "" });
                  }}
                >
                  Отмена
                </button>
                <button type="button" className="btn-primary" onClick={handleCreateModule}>
                  Создать модуль
                </button>
              </div>
            </div>
          )}
        </div>

        {course.modules?.length ? (
          course.modules.map((module) => (
            <div key={module.id} className="module-card">
              <div className="module-header">
                <div className="module-header-content">
                  <strong>{module.name}</strong>
                  <p>{module.description || "Без описания"}</p>
                </div>
                <button
                  type="button"
                  className="btn-delete btn-delete-module"
                  onClick={() => handleDeleteModule(module.id)}
                  title="Удалить модуль"
                >
                  🗑️
                </button>
              </div>

              <div className="add-topic-section">
                <button
                  type="button"
                  className="add-btn"
                  onClick={() => toggleTopicForm(module.id)}
                >
                  + Добавить тему
                </button>

                {openTopicForms[module.id] && (
                  <div className="add-topic-form">
                    <h4>Новая тема</h4>
                    <label>
                      Название темы:
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Введите название"
                        value={(newTopics[module.id]?.name) || ""}
                        onChange={(e) =>
                          setNewTopics({
                            ...newTopics,
                            [module.id]: { ...newTopics[module.id], name: e.target.value }
                          })
                        }
                      />
                    </label>
                    <label>
                      Описание (опционально):
                      <textarea
                        className="form-input"
                        rows="2"
                        placeholder="Описание темы"
                        value={(newTopics[module.id]?.description) || ""}
                        onChange={(e) =>
                          setNewTopics({
                            ...newTopics,
                            [module.id]: { ...newTopics[module.id], description: e.target.value }
                          })
                        }
                      ></textarea>
                    </label>
                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => toggleTopicForm(module.id)}
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleCreateTopic(module.id)}
                      >
                        Создать тему
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {module.topics?.length ? (
                module.topics.map((t) => (
                  <div key={t.id} className="topic-card">
                    <div className="topic-header">
                      <div className="topic-header-content">
                        <b>Название темы:</b>
                        <input
                          type="text"
                          value={t.name || ""}
                          onChange={(e) =>
                            handleTopicChange(module.id, t.id, "name", e.target.value)
                          }
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-delete btn-delete-topic"
                        onClick={() => handleDeleteTopic(module.id, t.id)}
                        title="Удалить тему"
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="topic-description">
                      <b>Описание темы:</b>
                      <input
                        type="text"
                        value={t.description || ""}
                        onChange={(e) =>
                          handleTopicChange(module.id, t.id, "description", e.target.value)
                        }
                      />
                    </div>

                    <div className="topic-contents">
                      <div className="topic-contents-header">
                        <h4>Материалы:</h4>
                        <button
                          type="button"
                          className="add-btn-small"
                          onClick={() => setShowAddContentForm((prev) => ({ ...prev, [t.id]: !prev[t.id] }))}
                        >
                          + Добавить материал
                        </button>
                      </div>

                      {/* Форма добавления нового материала */}
                      {showAddContentForm[t.id] && (
                        <div className="add-content-form">
                          <label>
                            Описание:
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Описание материала"
                              value={(newContentFiles[t.id]?.description) || ""}
                              onChange={(e) => handleNewContentDescriptionChange(t.id, e.target.value)}
                            />
                          </label>
                          <label>
                            Файл:
                            <input
                              type="file"
                              className="form-input"
                              onChange={(e) => handleContentFileChange(t.id, e)}
                            />
                          </label>
                          <div className="form-actions">
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => {
                                setShowAddContentForm((prev) => ({ ...prev, [t.id]: false }));
                                setNewContentFiles((prev) => {
                                  const newState = { ...prev };
                                  delete newState[t.id];
                                  return newState;
                                });
                              }}
                            >
                              Отмена
                            </button>
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => handleCreateTopicContent(module.id, t.id)}
                            >
                              Загрузить
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Список существующих материалов */}
                      {t.contents?.length ? (
                        <div className="contents-list">
                          {t.contents.map((c) => (
                            <div key={c.id} className="content-item-small">
                              <div className="content-info">
                                <span className="content-description">
                                  {c.description || "Без описания"}
                                </span>
                                <span className="content-file-name">
                                  {c.file ? c.file.split('/').pop() : "Файл не найден"}
                                </span>
                              </div>
                              <div className="content-actions">
                                <input
                                  type="text"
                                  className="content-description-input"
                                  value={c.description || ""}
                                  onChange={(e) =>
                                    handleTopicContentChange(
                                      module.id,
                                      t.id,
                                      c.id,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Описание"
                                />
                                <button
                                  type="button"
                                  className="btn-download"
                                  onClick={() => handleDownloadTopicContent(c.id)}
                                  title="Скачать"
                                >
                                  📥
                                </button>
                                <button
                                  type="button"
                                  className="btn-delete"
                                  onClick={() => handleDeleteTopicContent(module.id, t.id, c.id)}
                                  title="Удалить"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-content">Нет материалов</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p>Нет тем</p>
              )}

              <div className="module-tests-section">
                <div className="module-tests-header">
                  <h4>Тесты модуля</h4>
                  <button
                    type="button"
                    className="add-btn"
                    onClick={() => toggleTestForm(module.id)}
                  >
                    + Добавить тест
                  </button>
                </div>

                {openTestForms[module.id] && (
                  <div className="add-test-form">
                    <h4>Новый тест</h4>
                    <label>
                      Название теста:
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Название"
                        value={(newTests[module.id]?.name) || ""}
                        onChange={(e) =>
                          setNewTests({
                            ...newTests,
                            [module.id]: { ...newTests[module.id], name: e.target.value }
                          })
                        }
                      />
                    </label>
                    <label>
                      Описание:
                      <textarea
                        className="form-input"
                        rows="2"
                        placeholder="Описание"
                        value={(newTests[module.id]?.description) || ""}
                        onChange={(e) =>
                          setNewTests({
                            ...newTests,
                            [module.id]: { ...newTests[module.id], description: e.target.value }
                          })
                        }
                      ></textarea>
                    </label>
                    <label>
                      Продолжительность (мин):
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        value={(newTests[module.id]?.duration) || "10"}
                        onChange={(e) =>
                          setNewTests({
                            ...newTests,
                            [module.id]: { ...newTests[module.id], duration: e.target.value }
                          })
                        }
                      />
                    </label>
                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => toggleTestForm(module.id)}
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleCreateTest(module.id)}
                      >
                        Создать тест
                      </button>
                    </div>
                  </div>
                )}

                {module._tests?.length > 0 && (
                  <div className="module-tests-list">
                    {module._tests.map((test) => (
                      <div key={test.id} className="test-card">
                        <strong>{test.name || "Без названия"}</strong>
                        <div className="test-card-actions">
                          <button
                            className="edit-test-btn"
                            onClick={() =>
                              navigate(`/courses/${courseIdFromParams}/tests/${test.id}/edit`)
                            }
                          >
                            Редактировать
                          </button>
                          <button
                            type="button"
                            className="btn-delete btn-delete-test"
                            onClick={() => handleDeleteTest(test.id, false)}
                            title="Удалить тест"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>Нет модулей</p>
        )}

        <div className="global-tests-section">
          <div className="global-tests-header">
            <h3>Глобальные тесты (без привязки к модулю)</h3>
            <button
              type="button"
              className="add-btn"
              onClick={() => setShowAddGlobalTestForm(!showAddGlobalTestForm)}
            >
              + Добавить глобальный тест
            </button>
          </div>

          {showAddGlobalTestForm && (
            <div className="add-test-form">
              <h4>Новый глобальный тест</h4>
              <label>
                Название теста:
                <input
                  type="text"
                  className="form-input"
                  placeholder="Название"
                  value={newGlobalTest.name}
                  onChange={(e) => setNewGlobalTest({ ...newGlobalTest, name: e.target.value })}
                />
              </label>
              <label>
                Описание:
                <textarea
                  className="form-input"
                  rows="2"
                  placeholder="Описание"
                  value={newGlobalTest.description}
                  onChange={(e) => setNewGlobalTest({ ...newGlobalTest, description: e.target.value })}
                ></textarea>
              </label>
              <label>
                Продолжительность (мин):
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={newGlobalTest.duration}
                  onChange={(e) => setNewGlobalTest({ ...newGlobalTest, duration: e.target.value })}
                />
              </label>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowAddGlobalTestForm(false);
                    setNewGlobalTest({ name: "", description: "", duration: "10" });
                  }}
                >
                  Отмена
                </button>
                <button type="button" className="btn-primary" onClick={() => handleCreateTest()}>
                  Создать тест
                </button>
              </div>
            </div>
          )}

          {tests.filter(t => t._source === 'global').length > 0 && (
            <div className="global-tests-list">
              {tests
                .filter(t => t._source === 'global')
                .map((test) => (
                  <div key={test.id} className="test-card">
                    <strong>{test.name || "Без названия"}</strong>
                    <div className="test-card-actions">
                      <button
                        className="edit-test-btn"
                        onClick={() =>
                          navigate(`/courses/${courseIdFromParams}/tests/${test.id}/edit`)
                        }
                      >
                        Редактировать
                      </button>
                      <button
                        type="button"
                        className="btn-delete btn-delete-test"
                        onClick={() => handleDeleteTest(test.id, true)}
                        title="Удалить тест"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <button className="save-btn" onClick={handleSave}>
          💾 Сохранить изменения
        </button>
      </main>
    </div>
  );
}