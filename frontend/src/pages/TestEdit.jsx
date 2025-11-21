import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TeachingApi } from "../api";

export default function TestEdit() {
  const { testId, courseId } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [topics, setTopics] = useState([]); // Список тем для привязки вопросов
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Состояния для новых сущностей
  const [showAddQuestionForm, setShowAddQuestionForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ 
    text: "", 
    complexityPoints: 1, 
    questionType: "test",
    topicId: null 
  });
  const [openAnswerForms, setOpenAnswerForms] = useState({});
  const [newAnswers, setNewAnswers] = useState({});
  
  // Состояния для загрузки картинок вопросов
  const [questionFiles, setQuestionFiles] = useState({}); // questionId → File

  useEffect(() => {
    const id = Number(testId);
    if (isNaN(id)) {
      setError("Некорректный ID теста");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("jwtToken");
    const teachingApi = new TeachingApi();
    if (token) {
      teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    const fetchTestData = async () => {
      try {
        // Загрузка теста
        const testData = await teachingApi.getTestFullTestsTestIdGet(id);
        setTest(testData);

        // Загрузка тем для привязки вопросов
        await loadTopics(testData, teachingApi);

        // Загрузка вопросов
        const questionsData = await teachingApi.listQuestionsFullTestsTestIdQuestionsGet(id);

        // Загрузка ответов для каждого вопроса
        const questionsWithAnswers = await Promise.all(
          (questionsData || []).map(async (q) => {
            try {
              const answersData = await teachingApi.listAnswersFullQuestionsQuestionIdAnswersGet(q.id);
              return { ...q, answers: answersData || [] };
            } catch (err) {
              console.warn(`Не удалось загрузить ответы для вопроса ${q.id}`);
              return { ...q, answers: [] };
            }
          })
        );

        setQuestions(questionsWithAnswers);
      } catch (err) {
        console.error("Ошибка при загрузке теста или вопросов:", err);
        setError("Не удалось загрузить тест");
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
  }, [testId]);

  // Загрузка тем для привязки вопросов
  const loadTopics = async (testData, teachingApi) => {
    try {
      let allTopics = [];
      
      if (testData.courseId) {
        // Если тест привязан к курсу - загружаем все модули и темы
        const modules = await teachingApi.listModulesForCourseFullCoursesCourseIdModulesGet(testData.courseId);
        
        for (const module of modules || []) {
          try {
            const moduleTopics = await teachingApi.listTopicsFullCoursesCourseIdModulesModuleIdTopicsGet(
              testData.courseId,
              module.id
            );
            allTopics = [...allTopics, ...(moduleTopics || [])];
          } catch (err) {
            console.warn(`Не удалось загрузить темы модуля ${module.id}`);
          }
        }
      } else if (testData.moduleId) {
        // Если тест привязан к модулю - загружаем темы модуля
        // Нужно получить courseId из модуля
        const module = await teachingApi.getModuleFullModulesModuleIdGet(testData.moduleId);
        if (module && module.courseId) {
          const moduleTopics = await teachingApi.listTopicsFullCoursesCourseIdModulesModuleIdTopicsGet(
            module.courseId,
            testData.moduleId
          );
          allTopics = moduleTopics || [];
        }
      }
      
      setTopics(allTopics);
    } catch (err) {
      console.error("Ошибка загрузки тем:", err);
    }
  };

  const handleTestChange = (field, value) => setTest((prev) => ({ ...prev, [field]: value }));
  
  const handleQuestionChange = (qId, field, value) =>
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, [field]: value } : q))
    );
    
  const handleAnswerChange = (qId, aId, field, value) =>
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? { ...q, answers: q.answers.map((a) => (a.id === aId ? { ...a, [field]: value } : a)) }
          : q
      )
    );

  // Обработчик выбора файла для картинки вопроса
  const handleQuestionFileChange = (questionId, e) => {
    const file = e.target.files[0];
    if (file) {
      setQuestionFiles((prev) => ({ ...prev, [questionId]: file }));
    }
  };

  // Загрузка картинки вопроса
  const handleUploadQuestionPicture = async (questionId) => {
    const file = questionFiles[questionId];
    if (!file) {
      alert("Выберите файл");
      return;
    }

    const token = localStorage.getItem("jwtToken");
    const teachingApi = new TeachingApi();
    if (token) {
      teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
      const updatedQuestion = await teachingApi.uploadQuestionPictureFullQuestionsQuestionIdPicturePost(questionId, file);
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, picture: updatedQuestion.picture } : q))
      );
      setQuestionFiles((prev) => {
        const newState = { ...prev };
        delete newState[questionId];
        return newState;
      });
      alert("Картинка загружена!");
    } catch (err) {
      console.error("Ошибка загрузки картинки:", err);
      alert("Не удалось загрузить картинку");
    }
  };

  // Удаление картинки вопроса
  const handleDeleteQuestionPicture = async (questionId) => {
    if (!window.confirm("Вы уверены, что хотите удалить картинку?")) {
      return;
    }

    const token = localStorage.getItem("jwtToken");
    const teachingApi = new TeachingApi();
    if (token) {
      teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
      await teachingApi.deleteQuestionPictureFullQuestionsQuestionIdPictureDelete(questionId);
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, picture: null } : q))
      );
      alert("Картинка удалена!");
    } catch (err) {
      console.error("Ошибка удаления картинки:", err);
      alert("Не удалось удалить картинку");
    }
  };

  // --- Создание вопроса ---
  const handleCreateQuestion = async () => {
    if (!newQuestion.text?.trim()) {
      alert("Текст вопроса обязателен");
      return;
    }

    const token = localStorage.getItem("jwtToken");
    const teachingApi = new TeachingApi();
    if (token) {
      teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
      const questionCreate = {
        text: newQuestion.text.trim(),
        complexityPoints: Number(newQuestion.complexityPoints) || 1,
        testId: Number(testId),
        questionType: newQuestion.questionType || "test",
      };

      // Добавляем topicId, если выбран
      if (newQuestion.topicId) {
        questionCreate.topicId = Number(newQuestion.topicId);
      }

      const data = await teachingApi.createQuestionFullQuestionsPost(questionCreate);
      setQuestions((prev) => [...prev, { ...data, answers: [] }]);
      setNewQuestion({ text: "", complexityPoints: 1, questionType: "test", topicId: null });
      setShowAddQuestionForm(false);
      alert("Вопрос создан!");
    } catch (err) {
      console.error("Ошибка создания вопроса:", err);
      alert("Не удалось создать вопрос");
    }
  };

  // --- Создание ответа ---
  const handleCreateAnswer = async (questionId) => {
    const text = newAnswers[questionId]?.trim();
    if (!text) {
      alert("Текст ответа обязателен");
      return;
    }

    const token = localStorage.getItem("jwtToken");
    const teachingApi = new TeachingApi();
    if (token) {
      teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
      const answerCreate = {
        text,
        isCorrect: false,
        questionId,
      };

      const data = await teachingApi.createAnswerFullAnswersPost(answerCreate);
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, answers: [...q.answers, data] } : q
        )
      );
      setNewAnswers((prev) => ({ ...prev, [questionId]: "" }));
      setOpenAnswerForms((prev) => ({ ...prev, [questionId]: false }));
      alert("Ответ добавлен!");
    } catch (err) {
      console.error("Ошибка создания ответа:", err);
      alert("Не удалось создать ответ");
    }
  };

  const toggleAnswerForm = (questionId) => {
    setOpenAnswerForms((prev) => {
      const newState = { ...prev, [questionId]: !prev[questionId] };
      if (newState[questionId]) {
        setNewAnswers((prevAns) => ({ ...prevAns, [questionId]: "" }));
      }
      return newState;
    });
  };

  // --- Сохранение ---
  const handleSave = async () => {
    if (!test) return;
    const id = Number(testId);
    if (isNaN(id)) return;

    const urlCourseId = courseId ? Number(courseId) : null;
    const effectiveCourseId = test.courseId ? Number(test.courseId) : urlCourseId;
    const effectiveModuleId = test.moduleId ? Number(test.moduleId) : null;

    if (!effectiveCourseId && !effectiveModuleId) {
      alert("Тест должен быть привязан к курсу или модулю");
      return;
    }

    if (!test.name?.trim() || test.durationInMinutes <= 0) {
      alert("Заполните обязательные поля теста");
      return;
    }

    const token = localStorage.getItem("jwtToken");
    const teachingApi = new TeachingApi();
    if (token) {
      teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
      const testPayload = {
        name: test.name.trim(),
        description: test.description || "",
        durationInMinutes: Number(test.durationInMinutes),
        moduleId: null,
        courseId: null,
      };

      // Ensure exactly one of moduleId/courseId is set (server requires this)
      if (effectiveModuleId) {
        testPayload.moduleId = effectiveModuleId;
        testPayload.courseId = null;
      } else if (effectiveCourseId) {
        testPayload.courseId = effectiveCourseId;
        testPayload.moduleId = null;
      }

      console.log("Updating test payload:", testPayload);

      // Обновление теста
      await teachingApi.updateTestFullTestsTestIdPut(id, testPayload);

      // Обновление вопросов
      await Promise.all(
        questions.map((q) =>
          teachingApi.updateQuestionFullQuestionsQuestionIdPut(q.id, {
            text: q.text || "",
            complexityPoints: q.complexityPoints || 0,
            testId: id,
            questionType: q.questionType || "test",
            topicId: q.topicId || null,
            picture: q.picture || null,
          })
        )
      );

      // Загрузка картинок для вопросов, если есть выбранные файлы
      for (const [questionId, file] of Object.entries(questionFiles)) {
        try {
          await teachingApi.uploadQuestionPictureFullQuestionsQuestionIdPicturePost(Number(questionId), file);
        } catch (err) {
          console.error(`Ошибка загрузки картинки для вопроса ${questionId}:`, err);
        }
      }
      setQuestionFiles({});

      // Обновление ответов
      const answerPromises = [];
      questions.forEach((q) => {
        q.answers.forEach((a) => {
          answerPromises.push(
            teachingApi.updateAnswerFullAnswersAnswerIdPut(a.id, {
              text: a.text || "",
              isCorrect: Boolean(a.isCorrect),
              questionId: q.id,
            })
          );
        });
      });
      await Promise.all(answerPromises);

      alert("Тест успешно сохранён!");
      if (courseId) {
        navigate(`/courses/${courseId}/edit`);
      }
    } catch (err) {
      console.error("Ошибка при сохранении данных:", err);
      alert("Не все данные сохранены. Проверьте консоль.");
    }
  };

  // Удаление ответа
  const handleDeleteAnswer = async (questionId, answerId) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот ответ?")) {
      return;
    }

    const token = localStorage.getItem("jwtToken");
    const teachingApi = new TeachingApi();
    if (token) {
      teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
      await teachingApi.deleteAnswerFullAnswersAnswerIdDelete(answerId);
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? { ...q, answers: q.answers.filter((a) => a.id !== answerId) }
            : q
        )
      );
      alert("Ответ удалён!");
    } catch (err) {
      console.error("Ошибка удаления ответа:", err);
      alert("Не удалось удалить ответ");
    }
  };

  // Удаление вопроса
  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот вопрос? Все ответы также будут удалены.")) {
      return;
    }

    const token = localStorage.getItem("jwtToken");
    const teachingApi = new TeachingApi();
    if (token) {
      teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
      await teachingApi.deleteQuestionFullQuestionsQuestionIdDelete(questionId);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      alert("Вопрос удалён!");
    } catch (err) {
      console.error("Ошибка удаления вопроса:", err);
      alert("Не удалось удалить вопрос");
    }
  };

  // Удаление теста
  const handleDeleteTest = async () => {
    if (!window.confirm("Вы уверены, что хотите удалить этот тест? Все вопросы и ответы также будут удалены.")) {
      return;
    }

    const token = localStorage.getItem("jwtToken");
    const teachingApi = new TeachingApi();
    if (token) {
      teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
      await teachingApi.deleteTestFullTestsTestIdDelete(Number(testId));
      alert("Тест удалён!");
      if (courseId) {
        navigate(`/courses/${courseId}/edit`);
      } else {
        navigate("/teaching");
      }
    } catch (err) {
      console.error("Ошибка удаления теста:", err);
      alert("Не удалось удалить тест");
    }
  };

  if (loading) return <div className="p-8 text-center">Загрузка...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Ошибка: {error}</div>;
  if (!test) return <div className="p-8 text-center">Тест не найден</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Редактирование теста</h2>
        <button
          type="button"
          className="btn btn-danger"
          onClick={handleDeleteTest}
          title="Удалить тест"
        >
          🗑️ Удалить тест
        </button>
      </div>

      <div className="card mb-6">
        <div className="mb-4">
          <label className="block mb-1 font-medium">Название *</label>
          <input
            type="text"
            value={test.name || ""}
            onChange={(e) => handleTestChange("name", e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Описание</label>
          <textarea
            value={test.description || ""}
            onChange={(e) => handleTestChange("description", e.target.value)}
            rows="3"
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Продолжительность (минуты) *</label>
          <input
            type="number"
            min="1"
            value={test.durationInMinutes || ""}
            onChange={(e) => handleTestChange("durationInMinutes", e.target.value ? Number(e.target.value) : "")}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      {/* Кнопка добавления вопроса */}
      <div className="mb-6">
        <button
          type="button"
          className="btn btn-primary w-full md:w-auto"
          onClick={() => setShowAddQuestionForm(!showAddQuestionForm)}
        >
          + Добавить вопрос
        </button>

        {showAddQuestionForm && (
          <div className="card mt-4">
            <h4 className="mb-4 font-bold">Новый вопрос</h4>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Текст вопроса *</label>
              <textarea
                value={newQuestion.text}
                onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                rows="3"
                className="w-full p-2 border rounded"
                placeholder="Введите текст вопроса"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-1 font-medium">Сложность (баллы)</label>
                <input
                  type="number"
                  min="0"
                  value={newQuestion.complexityPoints}
                  onChange={(e) => setNewQuestion({ ...newQuestion, complexityPoints: Number(e.target.value) || 1 })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Тип вопроса</label>
                <select
                  value={newQuestion.questionType}
                  onChange={(e) => setNewQuestion({ ...newQuestion, questionType: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="test">Тестовый (с вариантами ответов)</option>
                  <option value="open">Открытый (текстовый ответ)</option>
                </select>
              </div>
            </div>
            {topics.length > 0 && (
              <div className="mb-4">
                <label className="block mb-1 font-medium">Привязать к теме (опционально)</label>
                <select
                  value={newQuestion.topicId || ""}
                  onChange={(e) => setNewQuestion({ ...newQuestion, topicId: e.target.value ? Number(e.target.value) : null })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Не привязывать</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-4 justify-end">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddQuestionForm(false);
                  setNewQuestion({ text: "", complexityPoints: 1, questionType: "test", topicId: null });
                }}
              >
                Отмена
              </button>
              <button type="button" className="btn btn-primary" onClick={handleCreateQuestion}>
                Создать вопрос
              </button>
            </div>
          </div>
        )}
      </div>

      <h3 className="text-xl font-bold mb-4">Вопросы ({questions.length})</h3>

      {questions.length === 0 ? (
        <p className="text-gray-500 italic">Нет вопросов</p>
      ) : (
        questions.map((q) => (
          <div key={q.id} className="card mb-6">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-bold text-lg">Вопрос #{q.id}</h4>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => handleDeleteQuestion(q.id)}
                title="Удалить вопрос"
              >
                🗑️
              </button>
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium">Текст *</label>
              <textarea
                value={q.text || ""}
                onChange={(e) => handleQuestionChange(q.id, "text", e.target.value)}
                rows="2"
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-1 font-medium">Тип вопроса</label>
                <select
                  value={q.questionType || "test"}
                  onChange={(e) => handleQuestionChange(q.id, "questionType", e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="test">Тестовый</option>
                  <option value="open">Открытый</option>
                </select>
              </div>

              {topics.length > 0 && (
                <div>
                  <label className="block mb-1 font-medium">Привязать к теме</label>
                  <select
                    value={q.topicId || ""}
                    onChange={(e) => handleQuestionChange(q.id, "topicId", e.target.value ? Number(e.target.value) : null)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Не привязывать</option>
                    {topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Картинка вопроса */}
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <label className="block mb-2 font-medium">Картинка вопроса</label>
              {q.picture ? (
                <div className="flex flex-col items-start gap-2">
                  <img
                    src={`/full/questions/${q.id}/picture`}
                    alt="Картинка вопроса"
                    className="max-w-full h-auto max-h-64 object-contain border rounded"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleDeleteQuestionPicture(q.id)}
                  >
                    Удалить картинку
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleQuestionFileChange(q.id, e)}
                    className="p-1 border rounded"
                  />
                  {questionFiles[q.id] && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleUploadQuestionPicture(q.id)}
                    >
                      Загрузить
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium">Сложность (баллы)</label>
              <input
                type="number"
                min="0"
                value={q.complexityPoints || 0}
                onChange={(e) => handleQuestionChange(q.id, "complexityPoints", Number(e.target.value))}
                className="w-full p-2 border rounded md:w-1/3"
              />
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <strong className="text-lg">Ответы:</strong>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => toggleAnswerForm(q.id)}
                >
                  + Добавить ответ
                </button>
              </div>

              {/* Форма добавления ответа */}
              {openAnswerForms[q.id] && (
                <div className="bg-gray-50 p-4 rounded mb-4 border">
                  <label className="block mb-1 font-medium">Текст нового ответа *</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      placeholder="Введите текст ответа"
                      value={newAnswers[q.id] || ""}
                      onChange={(e) =>
                        setNewAnswers((prev) => ({
                          ...prev,
                          [q.id]: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => toggleAnswerForm(q.id)}
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleCreateAnswer(q.id)}
                    >
                      Добавить
                    </button>
                  </div>
                </div>
              )}

              {q.answers.length === 0 && !openAnswerForms[q.id] ? (
                <p className="text-gray-500 italic">Нет ответов</p>
              ) : (
                <div className="space-y-2">
                  {q.answers.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 p-2 bg-white border rounded hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={a.isCorrect || false}
                        onChange={(e) => handleAnswerChange(q.id, a.id, "isCorrect", e.target.checked)}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                        title="Правильный ответ?"
                      />
                      <input
                        type="text"
                        value={a.text || ""}
                        onChange={(e) => handleAnswerChange(q.id, a.id, "text", e.target.value)}
                        placeholder="Текст ответа"
                        className="flex-1 p-2 border rounded"
                      />
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteAnswer(q.id, a.id)}
                        title="Удалить ответ"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))
      )}

      <div className="sticky bottom-4 bg-white p-4 shadow-lg rounded border border-gray-200 mt-8 flex justify-end">
        <button onClick={handleSave} className="btn btn-primary btn-lg shadow-md">
          💾 Сохранить всё
        </button>
      </div>
    </div>
  );
}