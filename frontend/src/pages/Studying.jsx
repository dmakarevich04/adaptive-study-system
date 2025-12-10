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
  const [moduleKnowledgeMap, setModuleKnowledgeMap] = useState({});
  const [moduleLocks, setModuleLocks] = useState({});
  const [isAuthor, setIsAuthor] = useState(false);
  const [bestTestResults, setBestTestResults] = useState({});
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

        // Загружаем уровень знаний по курсу (попытаемся получить всегда, если пользователь авторизован)
        try {
          const knowledgeData = await fullApi.myCourseKnowledgeFullMeCoursesKnowledgeGet();
          const courseKnowledgeItem = (knowledgeData || []).find(k => k.courseId === id);
          if (courseKnowledgeItem && courseKnowledgeItem.knowledge !== undefined) {
            setCourseKnowledge(Math.round(courseKnowledgeItem.knowledge));
          } else {
            setCourseKnowledge(0);
          }
        } catch (err) {
          // Если неавторизован или ошибка — просто показываем 0
          console.debug("Не удалось загрузить знания курса (возможно неавторизован):", err?.message || err);
          setCourseKnowledge(0);
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
        
        // Загружаем знания по модулям СРАЗУ для определения блокировки
        let moduleKnowledgeData = [];
        if (!authorCheck) {
          try {
            moduleKnowledgeData = await fullApi.myModuleKnowledgeFullMeModulesKnowledgeGet();
          } catch (err) {
            console.error("Ошибка загрузки знаний по модулям:", err);
            moduleKnowledgeData = [];
          }
        }
        
        // Создаем карту знаний по модулям
        const knowledgeMap = {};
        (moduleKnowledgeData || []).forEach((m) => {
          knowledgeMap[m.moduleId] = m.knowledge || 0;
        });
        
        // Определяем блокировку модулей на основе знаний
        // Модуль заблокирован, если предыдущий модуль не пройден (knowledge < 80%)
        const locks = {};
        if (!authorCheck && modulesData.length > 0) {
          modulesData.forEach((module, i) => {
            if (i === 0) {
              // Первый модуль всегда доступен
              locks[module.id] = { isLocked: false, message: "", isPassed: false };
            } else {
              // Проверяем, пройден ли предыдущий модуль
              const prevModule = modulesData[i - 1];
              const prevKnowledge = knowledgeMap[prevModule.id] || 0;
              const isPrevModulePassed = prevKnowledge >= 80;
              
              locks[module.id] = { 
                isLocked: !isPrevModulePassed, 
                message: !isPrevModulePassed ? "Модуль заблокирован. Пройдите предыдущий модуль." : "", 
                isPassed: false 
              };
            }
          });
          
          // Проверяем, все ли модули пройдены для теста курса
          const allModulesUnlocked = Object.values(locks).every(lock => !lock.isLocked);
          const lastModule = modulesData[modulesData.length - 1];
          const lastModuleKnowledge = knowledgeMap[lastModule.id] || 0;
          const lastModulePassed = lastModuleKnowledge >= 80;
          const allPassed = allModulesUnlocked && lastModulePassed;
          setAllModulesPassed(allPassed);
        } else if (authorCheck) {
          // Автор курса имеет доступ ко всему
          modulesData.forEach(module => {
            locks[module.id] = { isLocked: false, message: "", isPassed: false };
          });
          setAllModulesPassed(true);
        }
        
        // Устанавливаем состояние блокировки СРАЗУ
        setModuleLocks(locks);
        
        // Теперь рендерим модули
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

        // Обновляем карту знаний по модулям (для прогресс-баров)
        // Знания уже загружены выше для определения блокировки
          const map = {};
        (moduleKnowledgeData || []).forEach((m) => {
          map[m.moduleId] = Math.round(m.knowledge || 0);
          });
          setModuleKnowledgeMap(map);
        
        // Загружаем результаты тестов
        try {

          // additionally fetch my test results to determine best result per test
          try {
            const myResults = await fullApi.myResultsFullResultsGet();
            const best = {};
            (myResults || []).forEach((r) => {
              const tId = r.testId;
              const percent = r.result ?? r.percent ?? 0;
              const isPassed = r.isPassed ?? r.passed ?? false;
              if (!best[tId] || percent > best[tId].percent) {
                best[tId] = { percent, isPassed };
              }
            });
            setBestTestResults(best);
          } catch (err) {
            console.debug("Не удалось загрузить мои результаты:", err?.message || err);
          }

        } catch (err) {
          console.error("Ошибка загрузки уровня знаний модулей:", err);
          setModuleKnowledgeMap({});
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
    const willExpand = !newExpanded.has(moduleId);
    if (willExpand) newExpanded.add(moduleId); else newExpanded.delete(moduleId);

    // set expanded state immediately for faster UI feedback
    setExpandedModules(newExpanded);
    console.log("Module toggle", moduleId, "willExpand=", willExpand);

    if (willExpand && !moduleTopics[moduleId]) {
      try {
        const teachingApi = new TeachingApi();
        if (token) {
          teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
        }
        const topics = await teachingApi.listTopicsFullCoursesCourseIdModulesModuleIdTopicsGet(
          Number(courseId),
          moduleId
        );
        console.log("Loaded topics for module", moduleId, "count=", (topics || []).length);
        setModuleTopics((prev) => ({
          ...prev,
          [moduleId]: topics || []
        }));
      } catch (err) {
        console.error("Ошибка загрузки тем модуля:", err, err?.response || err?.message);
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
  };

  const handleTopicClick = (topicId) => {
    navigate(`/course-studying/${courseId}/topics/${topicId}/studying`);
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

    navigate(`/course-studying/${courseId}/tests/${testId}/take`);
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
    <div className="">
      <div className="card mb-6">
        <div className="flex gap-4 items-start">
          <div className="overflow-hidden rounded-lg" style={{ width: 120, height: 120, flexShrink: 0 }}>
            <img
              src={course.picture ? `/full/courses/${course.id}/picture` : "/default.png"}
              alt={course.name}
              onError={(e) => (e.target.src = "/default.png")}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">{course.name}</h1>
                <div className="mt-1 text-sm text-gray-600">Категория: <span className="font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{category?.name || "Без категории"}</span></div>
              </div>

              <div className="text-right">
                <button className="btn btn-secondary" onClick={() => navigate("/my-learning")}>← Мои курсы</button>
              </div>
            </div>

            <p className="mt-3 text-gray-700" style={{ lineHeight: 1.6 }}>{course.description}</p>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Уровень знаний: {courseKnowledge}%</div>
                <div className="text-sm text-gray-600">{courseKnowledge === 100 ? 'Выполнено' : ''}</div>
              </div>

              <div className="mt-2" style={{ maxWidth: '720px' }}>
                <div className="progress-track" style={{ height: '0.75rem' }}>
                  <div className="progress-fill" style={{ width: `${courseKnowledge}%` }} />
                </div>
                <div className="progress-text">Прогресс курса основан на агрегированных знаниях по модулям</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {courseTest && (
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Тест курса</h2>
              <div className="text-sm text-gray-600">{courseTest.name}</div>
              <p className="text-sm text-gray-600">{courseTest.description}</p>
            </div>
            <div>
              {allModulesPassed || isAuthor ? (
                (() => {
                  const best = bestTestResults[courseTest.id];
                  const blockedPerfect = best && best.percent === 100 && best.isPassed;
                  return (
                    <button
                      className={blockedPerfect ? "btn btn-secondary" : "btn btn-primary"}
                      onClick={() => !blockedPerfect && handleTestClick(courseTest.id)}
                      disabled={blockedPerfect}
                    >
                      {blockedPerfect ? `Пройден (100%)` : `Пройти тест`}
                    </button>
                  );
                })()
              ) : (
                <button className="btn btn-secondary" disabled>Тест заблокирован</button>
              )}
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold mb-4">Модули курса</h2>
        {modules.length === 0 ? (
          <p className="text-gray-600">Нет модулей</p>
        ) : (
          <div className="flex flex-col gap-4">
            {modules.map((module) => {
              const isExpanded = expandedModules.has(module.id);
              const topics = moduleTopics[module.id] || [];
              const tests = moduleTests[module.id] || [];
              const lock = moduleLocks[module.id];
              const isLocked = lock?.isLocked || false;

              return (
                <div 
                  key={module.id} 
                  className={`card mb-4 ${isLocked ? 'bg-gray-100 border-gray-300' : ''}`}
                  style={isLocked ? { pointerEvents: 'none', opacity: 0.7 } : {}}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-start gap-4">
                        {isLocked && (
                          <img 
                            src="/lock.png" 
                            alt="Заблокировано" 
                            style={{ width: '24px', height: '24px', flexShrink: 0, marginTop: '2px' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 className={`font-bold text-lg ${isLocked ? 'text-gray-500' : ''}`}>
                            {module.name}
                          </h3>
                          <p className={`text-sm ${isLocked ? 'text-gray-400' : 'text-gray-600'}`}>{module.description}</p>

                          <div className="mt-2" style={{ maxWidth: 420 }}>
                            <div className={`text-sm ${isLocked ? 'text-gray-400' : 'text-gray-600'}`}>Прогресс: {moduleKnowledgeMap[module.id] ?? 0}%</div>
                            <div className="progress-track mt-1">
                              <div className="progress-fill" style={{ width: `${moduleKnowledgeMap[module.id] ?? 0}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className={`btn btn-secondary`}
                        onClick={() => handleModuleToggle(module.id)}
                        disabled={isLocked}
                        style={isLocked ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                      >
                        {isExpanded ? 'Свернуть' : 'Открыть'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && !isLocked && (
                    <div className="mt-4">
                      <div className="mb-3">
                        <h4 className="font-medium">Темы</h4>
                        {topics.length === 0 ? (
                          <p className="text-gray-600">Нет тем</p>
                        ) : (
                          <div className="flex flex-col gap-2 mt-2">
                            {topics.map((topic) => (
                              <div key={topic.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                                <div>
                                  <div className="font-medium">{topic.name}</div>
                                  <div className="text-sm text-gray-600">{topic.description}</div>
                                </div>
                                <button className="btn btn-primary btn-sm" onClick={() => handleTopicClick(topic.id)}>Открыть</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {tests.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium">Тесты модуля</h4>
                          <div className="flex flex-col gap-2 mt-2">
                            {tests.map((t) => (
                              <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                                <div>
                                  <div className="font-medium">{t.name}</div>
                                  <div className="text-sm text-gray-600">{t.description}</div>
                                </div>
                                {(() => {
                                  const best = bestTestResults[t.id];
                                  const blockedPerfect = best && best.percent === 100 && best.isPassed;
                                  return (
                                    <button
                                      className={blockedPerfect ? "btn btn-secondary btn-sm" : "btn btn-primary btn-sm"}
                                      onClick={() => !blockedPerfect && handleTestClick(t.id, module.id)}
                                      disabled={blockedPerfect}
                                    >
                                      {blockedPerfect ? `Пройден (100%)` : `Пройти тест`}
                                    </button>
                                  );
                                })()}
                              </div>
                            ))}
                          </div>
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
