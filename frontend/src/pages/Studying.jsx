import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TeachingApi, FullApi } from "../api/index.js";

export default function Studying() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [category, setCategory] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedModules, setExpandedModules] = useState(new Set());
  const [moduleTopics, setModuleTopics] = useState({});
  const [moduleTests, setModuleTests] = useState({}); // Тесты модулей
  const [courseTest, setCourseTest] = useState(null); // Тест курса
  const [moduleLocks, setModuleLocks] = useState({});
  const [isAuthor, setIsAuthor] = useState(false);
  const [courseKnowledge, setCourseKnowledge] = useState(0);
  const [allModulesPassed, setAllModulesPassed] = useState(false); // Все ли модули пройдены

  const token = localStorage.getItem("jwtToken");

  useEffect(() => {
    const fetchData = async () => {
      const id = Number(courseId);
      if (isNaN(id)) {
        setError("Некорректный ID курса");
        setLoading(false);
        return;
      }

      const teachingApi = new TeachingApi();
      const fullApi = new FullApi();

      if (token) {
        teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
        fullApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
      }

      try {
        const courseData = await teachingApi.getCourseFullCoursesCourseIdGet(id);
        setCourse(courseData);

        // Проверяем, является ли текущий пользователь автором курса
        const usersApi = new (await import("../api/index.js")).UsersApi();
        if (token) {
          usersApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
        }
        const currentUser = await usersApi.meUsersMeGet();
        const authorCheck = courseData.authorId === currentUser.id;
        setIsAuthor(authorCheck);

        // Загружаем уровень знаний по курсу (только для студентов)
        if (!authorCheck) {
          try {
            const knowledgeData = await fullApi.myCourseKnowledgeFullMeCoursesKnowledgeGet();
            const courseKnowledgeItem = knowledgeData.find(k => k.courseId === id);
            if (courseKnowledgeItem && courseKnowledgeItem.knowledge !== undefined) {
              setCourseKnowledge(Math.round(courseKnowledgeItem.knowledge));
            } else {
              setCourseKnowledge(0);
            }
          } catch (err) {
            console.error("Ошибка загрузки уровня знаний:", err);
            setCourseKnowledge(0);
          }
        }

        if (courseData.categoryId) {
          try {
            const catData = await fullApi.getCategoryFullAdminCategoriesCatIdGet(courseData.categoryId);
            setCategory(catData);
          } catch (err) {
            setCategory({ name: "Неизвестная категория" });
          }
        } else {
          setCategory({ name: "Без категории" });
        }

        const modulesData = await teachingApi.listModulesForCourseFullCoursesCourseIdModulesGet(id);
        setModules(modulesData);

        // Загружаем тест курса
        try {
          const courseTests = await teachingApi.listTestsFullTestsGet({ courseId: id });
          if (courseTests && courseTests.length > 0) {
            setCourseTest(courseTests[0]);
          }
        } catch (err) {
          console.error("Ошибка загрузки теста курса:", err);
        }

        // Загружаем тесты для каждого модуля
        const testsMap = {};
        for (const module of modulesData) {
          try {
            const moduleTestsData = await teachingApi.listTestsFullTestsGet({ moduleId: module.id });
            testsMap[module.id] = moduleTestsData || [];
          } catch (err) {
            console.error(`Ошибка загрузки тестов модуля ${module.id}:`, err);
            testsMap[module.id] = [];
          }
        }
        setModuleTests(testsMap);

        // Проверяем доступность модулей и завершенность курса (только для студентов)
        if (!authorCheck && modulesData.length > 0) {
          const locks = {};
          
          // Проверяем ВСЕ модули, включая первый
          for (let i = 0; i < modulesData.length; i++) {
            const module = modulesData[i];
            if (i === 0) {
              // Первый модуль всегда доступен
              locks[module.id] = { isLocked: false, message: "", isPassed: false };
            } else {
              // Для остальных модулей проверяем доступность через попытку загрузить темы
              try {
                await teachingApi.listTopicsFullCoursesCourseIdModulesModuleIdTopicsGet(
                  Number(courseId),
                  module.id
                );
                locks[module.id] = { isLocked: false, message: "", isPassed: false };
              } catch (err) {
                if (err.status === 403) {
                  const errorDetail = err.response?.data?.detail || "";
                  if (errorDetail.includes("Module locked") || errorDetail.includes("locked")) {
                    locks[module.id] = { 
                      isLocked: true, 
                      message: "Модуль заблокирован. Пройдите предыдущий модуль.",
                      isPassed: false
                    };
                  } else {
                    locks[module.id] = { isLocked: false, message: "", isPassed: false };
                  }
                } else {
                  locks[module.id] = { isLocked: false, message: "", isPassed: false };
                }
              }
            }
          }

          // Проверяем, что ВСЕ модули не заблокированы (т.е. предыдущие пройдены)
          // И проверяем доступность последнего модуля - если он доступен, значит предыдущие пройдены
          let allModulesUnlocked = true;
          let lastModuleAccessible = false;

          if (modulesData.length > 0) {
            allModulesUnlocked = Object.values(locks).every(lock => !lock.isLocked);
            
            // Дополнительная проверка: пытаемся получить доступ к последнему модулю
            const lastModule = modulesData[modulesData.length - 1];
            if (allModulesUnlocked && !locks[lastModule.id]?.isLocked) {
              try {
                // Попытка получить темы последнего модуля - если доступно, значит все предыдущие пройдены
                await teachingApi.listTopicsFullCoursesCourseIdModulesModuleIdTopicsGet(
                  Number(courseId),
                  lastModule.id
                );
                lastModuleAccessible = true;
              } catch (err) {
                lastModuleAccessible = false;
              }
            }
          }

          // Тест курса доступен только если все модули разблокированы И последний модуль доступен
          const allPassed = allModulesUnlocked && lastModuleAccessible;
          setAllModulesPassed(allPassed);
          setModuleLocks(locks);
        } else if (authorCheck) {
          // Автор курса имеет доступ ко всему
          const locks = {};
          modulesData.forEach(module => {
            locks[module.id] = { isLocked: false, message: "", isPassed: false };
          });
          setModuleLocks(locks);
          setAllModulesPassed(true);
        }
      } catch (err) {
        console.error("Ошибка при загрузке курса:", err);
        if (err.status === 401 || err.status === 403) {
          setError("У вас нет доступа к этому курсу");
        } else {
          setError("Не удалось загрузить курс");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, token]);

  const handleModuleToggle = async (moduleId) => {
    const lock = moduleLocks[moduleId];
    if (lock?.isLocked) {
      return;
    }

    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
      if (!moduleTopics[moduleId]) {
        try {
          const teachingApi = new TeachingApi();
          if (token) {
            teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
          }
          const topics = await teachingApi.listTopicsFullCoursesCourseIdModulesModuleIdTopicsGet(
            Number(courseId),
            moduleId
          );
          setModuleTopics((prev) => ({
            ...prev,
            [moduleId]: topics || []
          }));
        } catch (err) {
          console.error("Ошибка загрузки тем модуля:", err);
          if (err.status === 403 || err.response?.data?.detail === "Module locked") {
            setModuleLocks((prev) => ({
              ...prev,
              [moduleId]: { isLocked: true, message: "Модуль заблокирован. Пройдите предыдущий модуль." }
            }));
          }
          setModuleTopics((prev) => ({
            ...prev,
            [moduleId]: []
          }));
        }
      }
    }
    setExpandedModules(newExpanded);
  };

  const handleTopicClick = (topicId) => {
    navigate(`/courses/${courseId}/topics/${topicId}/studying`);
  };

  // Обновляем handleTestClick, чтобы проверять доступность перед переходом
  const handleTestClick = (testId, moduleId = null) => {
    // Проверяем, если это тест модуля, что модуль не заблокирован
    if (moduleId) {
      const lock = moduleLocks[moduleId];
      if (lock?.isLocked) {
        alert("Модуль заблокирован. Пройдите предыдущий модуль.");
        return;
      }
    }
    
    // Проверяем, если это тест курса, что все модули пройдены
    if (!moduleId && courseTest && courseTest.id === testId) {
      if (!allModulesPassed && !isAuthor) {
        alert("Пройдите все модули для доступа к тесту курса.");
        return;
      }
    }

    navigate(`/courses/${courseId}/tests/${testId}/take`);
  };

  if (loading) {
    return <div className="loading">Загрузка курса...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={() => navigate("/my-learning")}>
          Вернуться к моим курсам
        </button>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="studying-page">
      <div className="studying-header">
        <button onClick={() => navigate("/my-learning")}>
          ← Назад к моим курсам
        </button>
        <div className="course-header-content">
          <img
            src={course.picture ? `/full/courses/${course.id}/picture` : "/default.png"}
            alt={course.name}
            onError={(e) => (e.target.src = "/default.png")}
          />
          <div>
            <h1>{course.name}</h1>
            <p className="course-category">
              Категория: {category?.name || "Без категории"}
            </p>
            <p className="course-description">{course.description}</p>
            
            {/* Прогресс-бар уровня знаний (только для студентов) */}
            {!isAuthor && (
              <div className="knowledge-progress">
                <div className="knowledge-progress-label">
                  Уровень знаний: {courseKnowledge}%
                </div>
                <div className="knowledge-progress-bar">
                  <div 
                    className="knowledge-progress-fill"
                    style={{ width: `${courseKnowledge}%` }}
                  >
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Тест курса */}
      {courseTest && (
        <div className="course-test-section">
          <h2>Тест курса</h2>
          <div className={`test-item ${!allModulesPassed && !isAuthor ? 'test-locked' : ''}`}>
            <div>
              <h3>
                {courseTest.name}
                {!allModulesPassed && !isAuthor && <span className="lock-icon">🔒</span>}
              </h3>
              <p>{courseTest.description}</p>
              <p>Продолжительность: {courseTest.durationInMinutes} минут</p>
              {!allModulesPassed && !isAuthor && (
                <p className="lock-message">Пройдите все модули для доступа к тесту курса</p>
              )}
            </div>
            {allModulesPassed || isAuthor ? (
              <button 
                className="take-test-button"
                onClick={() => handleTestClick(courseTest.id)}
              >
                Пройти тест
              </button>
            ) : (
              <button 
                className="take-test-button" 
                disabled
                onClick={() => alert("Пройдите все модули для доступа к тесту курса.")}
              >
                Тест заблокирован
              </button>
            )}
          </div>
        </div>
      )}

      <div className="modules-section">
        <h2>Модули курса</h2>
        {modules.length === 0 ? (
          <p>Нет модулей</p>
        ) : (
          <div className="modules-list">
            {modules.map((module, index) => {
              const isExpanded = expandedModules.has(module.id);
              const topics = moduleTopics[module.id] || [];
              const tests = moduleTests[module.id] || [];
              const lock = moduleLocks[module.id];
              const isLocked = lock?.isLocked || false;

              return (
                <div 
                  key={module.id} 
                  className={`module-item ${isLocked ? 'module-locked' : ''}`}
                >
                  <div 
                    className={`module-header ${isLocked ? 'locked' : ''}`}
                    onClick={() => !isLocked && handleModuleToggle(module.id)}
                  >
                    <div>
                      <h3>
                        {module.name}
                        {isLocked && <span className="lock-icon">🔒</span>}
                      </h3>
                      <p>{module.description}</p>
                      {isLocked && lock.message && (
                        <p className="lock-message">{lock.message}</p>
                      )}
                    </div>
                    {!isLocked && (
                      <span>{isExpanded ? "▼" : "▶"}</span>
                    )}
                  </div>

                  {isExpanded && !isLocked && (
                    <div className="module-content">
                      {/* Темы модуля */}
                      <div className="topics-list">
                        <h4>Темы</h4>
                        {topics.length === 0 ? (
                          <p>Нет тем</p>
                        ) : (
                          topics.map((topic) => (
                            <div
                              key={topic.id}
                              className="topic-item"
                              onClick={() => handleTopicClick(topic.id)}
                            >
                              <h5>{topic.name}</h5>
                              <p>{topic.description}</p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Тесты модуля */}
                      {tests.length > 0 && (
                        <div className="tests-list">
                          <h4>Тесты модуля</h4>
                          {tests.map((test) => (
                            <div key={test.id} className="test-item">
                              <div>
                                <h5>{test.name}</h5>
                                <p>{test.description}</p>
                                <p>Продолжительность: {test.durationInMinutes} минут</p>
                              </div>
                              <button 
                                className="take-test-button"
                                onClick={() => handleTestClick(test.id, module.id)}
                              >
                                Пройти тест
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
