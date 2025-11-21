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
  const [imageError, setImageError] = useState(false);

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
        setImageError(false);
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
      moduleId: null,
      courseId: null
    };
    if (moduleId) {
      testCreate.moduleId = moduleId;
    } else {
      testCreate.courseId = courseId;
    }

    try {
      console.log("Creating test payload:", testCreate);
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
      // Try to extract server-side detail if available (openapi client / fetch wrappers may store it differently)
      const serverDetail = err?.body?.detail || (err?.response && (err.response.text || err.response.statusText)) || err?.message;
      alert("Не удалось создать тест: " + (serverDetail || "Неизвестная ошибка"));
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
        setImageError(false);
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
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">
      <aside className="lg:sticky lg:top-4">
        <div className="card">
          <div
            className="relative cursor-pointer mb-4 rounded-lg overflow-hidden group"
            onClick={() => document.getElementById("fileInput").click()}
          >
            <img
              src={
                imagePreview
                  ? imagePreview
                  : (imageError ? "https://via.placeholder.com/300x200?text=Upload+Image" : `/full/courses/${courseIdFromParams}/picture`)
              }
              alt={course.name}
              className="w-full h-48 object-cover transition-transform group-hover:scale-105"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white p-2 text-center text-sm opacity-0 group-hover:opacity-100 transition-opacity">
              Нажмите, чтобы изменить
            </div>
            <input
              type="file"
              id="fileInput"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-medium">Название курса</label>
            <input
              type="text"
              value={course.name || ""}
              onChange={(e) => handleCourseChange("name", e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-medium">Категория</label>
            <select
              value={course.categoryId || ""}
              onChange={(e) =>
                handleCourseChange("categoryId", Number(e.target.value))
              }
              className="w-full p-2 border rounded"
            >
              <option value="">Выберите категорию</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-medium">Описание</label>
            <textarea
              rows="5"
              value={course.description || ""}
              onChange={(e) => handleCourseChange("description", e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="isPublished"
              checked={course.isPublished || false}
              onChange={(e) =>
                handleCourseChange("isPublished", e.target.checked)
              }
              className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="isPublished" className="cursor-pointer select-none">Опубликован</label>
          </div>
          
          <button className="btn btn-primary w-full" onClick={handleSave}>
            💾 Сохранить изменения
          </button>
        </div>
      </aside>

      <main>
        <h1 className="text-2xl font-bold mb-6">Редактирование курса</h1>

        <div className="mb-4">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowAddModuleForm(!showAddModuleForm)}
          >
            + Добавить модуль
          </button>

          {showAddModuleForm && (
            <div className="card mt-4">
              <h4 className="mb-4 font-bold">Новый модуль</h4>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Название модуля</label>
                <input
                  type="text"
                  placeholder="Введите название"
                  value={newModule.name}
                  onChange={(e) => setNewModule({ ...newModule, name: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Описание (опционально)</label>
                <textarea
                  rows="2"
                  placeholder="Описание модуля"
                  value={newModule.description}
                  onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                  className="w-full p-2 border rounded"
                ></textarea>
              </div>
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddModuleForm(false);
                    setNewModule({ name: "", description: "" });
                  }}
                >
                  Отмена
                </button>
                <button type="button" className="btn btn-primary" onClick={handleCreateModule}>
                  Создать модуль
                </button>
              </div>
            </div>
          )}
        </div>

        {course.modules?.length ? (
          course.modules.map((module) => (
            <div key={module.id} className="card mb-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="mb-1">{module.name}</h3>
                  <p className="text-secondary">{module.description || "Без описания"}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDeleteModule(module.id)}
                  title="Удалить модуль"
                >
                  🗑️
                </button>
              </div>

              <div className="mb-4">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => toggleTopicForm(module.id)}
                >
                  + Добавить тему
                </button>

                {openTopicForms[module.id] && (
                  <div className="card mt-4 bg-gray-50">
                    <h4 className="mb-4 font-bold">Новая тема</h4>
                    <div className="mb-4">
                      <label className="block mb-1 font-medium">Название темы</label>
                      <input
                        type="text"
                        placeholder="Введите название"
                        value={(newTopics[module.id]?.name) || ""}
                        onChange={(e) =>
                          setNewTopics({
                            ...newTopics,
                            [module.id]: { ...newTopics[module.id], name: e.target.value }
                          })
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block mb-1 font-medium">Описание (опционально)</label>
                      <textarea
                        rows="2"
                        placeholder="Описание темы"
                        value={(newTopics[module.id]?.description) || ""}
                        onChange={(e) =>
                          setNewTopics({
                            ...newTopics,
                            [module.id]: { ...newTopics[module.id], description: e.target.value }
                          })
                        }
                        className="w-full p-2 border rounded"
                      ></textarea>
                    </div>
                    <div className="flex gap-4 justify-end">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => toggleTopicForm(module.id)}
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
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
                  <div key={t.id} className="card mb-4 border border-gray-200 shadow-none">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 mr-4">
                        <label className="block text-xs text-gray-500 mb-1">Название темы</label>
                        <input
                          type="text"
                          value={t.name || ""}
                          onChange={(e) =>
                            handleTopicChange(module.id, t.id, "name", e.target.value)
                          }
                          className="w-full p-2 border rounded mb-2"
                        />
                        <label className="block text-xs text-gray-500 mb-1">Описание темы</label>
                        <input
                          type="text"
                          value={t.description || ""}
                          onChange={(e) =>
                            handleTopicChange(module.id, t.id, "description", e.target.value)
                          }
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteTopic(module.id, t.id)}
                        title="Удалить тему"
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-bold">Материалы</h4>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm text-xs py-1 px-2"
                          onClick={() => setShowAddContentForm((prev) => ({ ...prev, [t.id]: !prev[t.id] }))}
                        >
                          + Добавить материал
                        </button>
                      </div>

                      {/* Форма добавления нового материала */}
                      {showAddContentForm[t.id] && (
                        <div className="card bg-gray-50 mb-4">
                          <div className="mb-2">
                            <label className="block mb-1 font-medium">Описание</label>
                            <input
                              type="text"
                              placeholder="Описание материала"
                              value={(newContentFiles[t.id]?.description) || ""}
                              onChange={(e) => handleNewContentDescriptionChange(t.id, e.target.value)}
                              className="w-full p-2 border rounded"
                            />
                          </div>
                          <div className="mb-4">
                            <label className="block mb-1 font-medium">Файл</label>
                            <input
                              type="file"
                              onChange={(e) => handleContentFileChange(t.id, e)}
                              className="w-full p-1 border rounded bg-white"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
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
                              className="btn btn-primary btn-sm"
                              onClick={() => handleCreateTopicContent(module.id, t.id)}
                            >
                              Загрузить
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Список существующих материалов */}
                      {t.contents?.length ? (
                        <div className="space-y-2">
                          {t.contents.map((c) => (
                            <div key={c.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                              <div className="flex-1 mr-4">
                                <div className="text-sm font-medium mb-1 text-blue-600">
                                  {c.file ? c.file.split('/').pop() : "Файл не найден"}
                                </div>
                                <input
                                  type="text"
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
                                  className="text-sm p-1 border rounded w-full"
                                />
                              </div>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleDownloadTopicContent(c.id)}
                                  title="Скачать"
                                >
                                  📥
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
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
                        <p className="text-secondary text-sm italic">Нет материалов</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-secondary mb-4">Нет тем</p>
              )}

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h4>Тесты модуля</h4>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => toggleTestForm(module.id)}
                  >
                    + Добавить тест
                  </button>
                </div>

                {openTestForms[module.id] && (
                  <div className="card bg-gray-50 mb-4">
                    <h4 className="mb-4 font-bold">Новый тест</h4>
                    <div className="mb-4">
                      <label className="block mb-1 font-medium">Название теста</label>
                      <input
                        type="text"
                        placeholder="Название"
                        value={(newTests[module.id]?.name) || ""}
                        onChange={(e) =>
                          setNewTests({
                            ...newTests,
                            [module.id]: { ...newTests[module.id], name: e.target.value }
                          })
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block mb-1 font-medium">Описание</label>
                      <textarea
                        rows="2"
                        placeholder="Описание"
                        value={(newTests[module.id]?.description) || ""}
                        onChange={(e) =>
                          setNewTests({
                            ...newTests,
                            [module.id]: { ...newTests[module.id], description: e.target.value }
                          })
                        }
                        className="w-full p-2 border rounded"
                      ></textarea>
                    </div>
                    <div className="mb-4">
                      <label className="block mb-1 font-medium">Продолжительность (мин)</label>
                      <input
                        type="number"
                        min="1"
                        value={(newTests[module.id]?.duration) || "10"}
                        onChange={(e) =>
                          setNewTests({
                            ...newTests,
                            [module.id]: { ...newTests[module.id], duration: e.target.value }
                          })
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div className="flex gap-4 justify-end">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => toggleTestForm(module.id)}
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleCreateTest(module.id)}
                      >
                        Создать тест
                      </button>
                    </div>
                  </div>
                )}

                {module._tests?.length > 0 && (
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    {module._tests.map((test) => (
                      <div key={test.id} className="card bg-gray-50 border border-gray-200 shadow-none flex justify-between items-center p-4">
                        <strong>{test.name || "Без названия"}</strong>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() =>
                              navigate(`/courses/${courseIdFromParams}/tests/${test.id}/edit`)
                            }
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
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
          <p className="text-secondary">Нет модулей</p>
        )}

        <div className="mt-8 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3>Глобальные тесты (без привязки к модулю)</h3>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowAddGlobalTestForm(!showAddGlobalTestForm)}
            >
              + Добавить глобальный тест
            </button>
          </div>

          {showAddGlobalTestForm && (
            <div className="card mb-4">
              <h4>Новый глобальный тест</h4>
              <div className="mb-4">
                <label>Название теста</label>
                <input
                  type="text"
                  placeholder="Название"
                  value={newGlobalTest.name}
                  onChange={(e) => setNewGlobalTest({ ...newGlobalTest, name: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label>Описание</label>
                <textarea
                  rows="2"
                  placeholder="Описание"
                  value={newGlobalTest.description}
                  onChange={(e) => setNewGlobalTest({ ...newGlobalTest, description: e.target.value })}
                ></textarea>
              </div>
              <div className="mb-4">
                <label>Продолжительность (мин)</label>
                <input
                  type="number"
                  min="1"
                  value={newGlobalTest.duration}
                  onChange={(e) => setNewGlobalTest({ ...newGlobalTest, duration: e.target.value })}
                />
              </div>
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddGlobalTestForm(false);
                    setNewGlobalTest({ name: "", description: "", duration: "10" });
                  }}
                >
                  Отмена
                </button>
                <button type="button" className="btn btn-primary" onClick={() => handleCreateTest()}>
                  Создать тест
                </button>
              </div>
            </div>
          )}

          {tests.filter(t => t._source === 'global').length > 0 && (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {tests
                .filter(t => t._source === 'global')
                .map((test) => (
                  <div key={test.id} className="card flex justify-between items-center p-4">
                    <strong>{test.name || "Без названия"}</strong>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() =>
                          navigate(`/courses/${courseIdFromParams}/tests/${test.id}/edit`)
                        }
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
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
      </main>
    </div>
  );
}