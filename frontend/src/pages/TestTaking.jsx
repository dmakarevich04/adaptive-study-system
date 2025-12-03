import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TeachingApi, FullApi, UsersApi } from "../api/index.js";

export default function TestTaking() {
  const { courseId, testId } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionAnswers, setQuestionAnswers] = useState({}); // { questionId: [answers] }
  const [userAnswers, setUserAnswers] = useState({}); // { questionId: answerId или текст }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [alreadyPassed100, setAlreadyPassed100] = useState(false); // Тест уже пройден на 100%
  
  // Таймер
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef(null);

  const token = localStorage.getItem("jwtToken");

  useEffect(() => {
    const fetchData = async () => {
      const id = Number(testId);
      if (isNaN(id)) {
        setError("Некорректный ID теста");
        setLoading(false);
        return;
      }

      const teachingApi = new TeachingApi();

      if (token) {
        teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
      }

      try {
        // Загружаем информацию о тесте
        const testData = await teachingApi.getTestFullTestsTestIdGet(id);
        setTest(testData);

        // Проверяем, есть ли уже результат на 100%
        try {
          const fullApi = new FullApi();
          if (token) {
            fullApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
          }
          const myResults = await fullApi.myResultsFullResultsGet();
          const testResults = (myResults || []).filter(r => r.testId === id);
          const hasPerfectResult = testResults.some(r => {
            const percent = r.result ?? r.percent ?? 0;
            const isPassed = r.isPassed ?? r.passed ?? false;
            return percent === 100 && isPassed;
          });
          setAlreadyPassed100(hasPerfectResult);
        } catch (err) {
          console.debug("Не удалось загрузить результаты:", err?.message || err);
        }

        // Загружаем вопросы теста
        const questionsData = await teachingApi.listQuestionsFullTestsTestIdQuestionsGet(id);
        setQuestions(questionsData || []);

        // Загружаем ответы для каждого вопроса
        const answersMap = {};
        for (const question of questionsData || []) {
          try {
            const answers = await teachingApi.listAnswersFullQuestionsQuestionIdAnswersGet(question.id);
            answersMap[question.id] = answers || [];
          } catch (err) {
            console.error(`Ошибка загрузки ответов для вопроса ${question.id}:`, err);
            answersMap[question.id] = [];
          }
        }
        setQuestionAnswers(answersMap);
      } catch (err) {
        console.error("Ошибка при загрузке теста:", err);
        if (err.status === 401 || err.status === 403) {
          setError("У вас нет доступа к этому тесту");
        } else {
          setError("Не удалось загрузить тест");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [testId, token]);

  // Запуск таймера при начале теста
  useEffect(() => {
    if (testStarted && !submitting && !testResult) {  // Добавлена проверка !testResult
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [testStarted, submitting, testResult]);  // Добавлен testResult в зависимости

  // Форматирование времени
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const handleStartTest = () => {
    setTestStarted(true);
    setElapsedSeconds(0);
  };

  const handleAnswerChange = (questionId, answerId) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  const handleMultipleAnswerChange = (questionId, answerId, checked) => {
    setUserAnswers((prev) => {
      const current = prev[questionId] || [];
      const answerArray = Array.isArray(current) ? [...current] : [];
      
      if (checked) {
        if (!answerArray.includes(answerId)) {
          answerArray.push(answerId);
        }
      } else {
        const index = answerArray.indexOf(answerId);
        if (index > -1) {
          answerArray.splice(index, 1);
        }
      }
      
      return {
        ...prev,
        [questionId]: answerArray
      };
    });
  };

  const handleOpenAnswerChange = (questionId, text) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: text
    }));
  };

  const handleFinishTest = async () => {
    if (submitting) return;

    const confirmFinish = window.confirm("Вы уверены, что хотите завершить тест?");
    if (!confirmFinish) return;

    setSubmitting(true);

    try {
      const fullApi = new FullApi();
      const usersApi = new UsersApi();

      if (token) {
        fullApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
        usersApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
      }

      // Получаем ID текущего пользователя
      const currentUser = await usersApi.meUsersMeGet();
      const userId = currentUser.id;

      // Формируем ответы в формате, который ожидает бэкенд
      // Бэкенд ожидает: { questionId: answerId } где ключи - строки (JSON всегда использует строки для ключей)
      // и значения - числа (ID ответа)
      const answersToSubmit = {};
      
      for (const question of questions) {
        const userAnswer = userAnswers[question.id];
        
        if (userAnswer !== undefined && userAnswer !== null && userAnswer !== "") {
          if (question.questionType === "test") {
            // Для тестовых вопросов отправляем ID ответа
            if (Array.isArray(userAnswer)) {
              // Если множественный выбор, берем первый (бэкенд пока поддерживает только один)
              if (userAnswer.length > 0) {
                // Ключи должны быть строками для JSON
                answersToSubmit[String(question.id)] = Number(userAnswer[0]);
              }
            } else {
              // Ключи должны быть строками, значения - числами
              answersToSubmit[String(question.id)] = Number(userAnswer);
            }
          } else if (question.questionType === "open") {
            // Для открытых вопросов отправляем текст ответа
            // Ключи должны быть строками, значения - строками
            answersToSubmit[String(question.id)] = String(userAnswer);
          }
        }
      }

      // Вычисляем время прохождения в минутах (дробные минуты для точности)
      const timeSpentInMinutes = elapsedSeconds / 60.0; // e.g. 90s -> 1.5

      console.log("Отправляемые ответы:", answersToSubmit);
      console.log("Время прохождения (секунды):", elapsedSeconds);
      console.log("Время прохождения (минуты):", timeSpentInMinutes);

      // Отправляем тест с дробным временем прохождения
      const requestBody = {
        answers: answersToSubmit,
        duration_in_minutes: timeSpentInMinutes
      };

      const result = await fullApi.submitTestFullTestsTestIdSubmitPost(
        Number(testId),
        requestBody
      );

      setTestResult(result);
      setSubmitting(false);
      // Убрали автоматическое перенаправление
    } catch (err) {
      console.error("Ошибка при завершении теста:", err);
      console.error("Детали ошибки:", err.response);
      // Пытаемся получить более детальную информацию об ошибке
      let errorMessage = "Не удалось завершить тест";
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
          // Улучшаем сообщение для лимита попыток
          if (errorMessage.includes("Max attempts reached")) {
            errorMessage = "Достигнут лимит попыток прохождения теста. Обратитесь к преподавателю для сброса попыток или попробуйте другой тест.";
          }
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка теста...</div>;
  }

  if (error && !testResult) {
    return (
      <div className="card text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button className="btn btn-secondary" onClick={() => navigate(`/courses/${courseId}/studying`)}>
          Вернуться к курсу
        </button>
      </div>
    );
  }

  if (!test) {
    return null;
  }

  // Экран с результатом
  if (testResult) {
    // Сохраняем финальное время прохождения
    const finalTime = elapsedSeconds;
    
    // Бэкенд возвращает: { score, percent, passed, attempts, recommendations }
    const score = testResult.score || testResult.scoreInPoints || 0;
    const percent = testResult.percent || testResult.result || 0;
    const isPassed = testResult.passed !== undefined ? testResult.passed : testResult.isPassed;
    const recommendations = testResult.recommendations || [];
    // optionally returned by backend after recomputing aggregates
    const moduleKnowledge = testResult.module_knowledge ?? null;
    const courseKnowledge = testResult.course_knowledge ?? null;
    
    return (
      <div className="card">
        <div className="test-result">
          <h1 className="text-2xl font-bold mb-2">Тест завершен!</h1>
          <p className="mb-1">Результат: <span className="font-bold">{percent}%</span></p>
          <p className="mb-1">Правильных ответов: <span className="font-bold">{score}</span> из {questions.length}</p>
          <p className="mb-1">Статус: <span className="font-bold">{isPassed ? "Пройден" : "Не пройден"}</span></p>
          <p className="mb-4">Время прохождения: {formatTime(finalTime)}</p>

          {recommendations.length > 0 && (
            <div className="card bg-yellow-100 mb-4">
              <h2 className="font-bold mb-2">Рекомендации</h2>
              {recommendations.map((rec, index) => (
                <div key={index} className="mb-2">
                  <p>{rec.message}</p>
                  {rec.topic_ids && rec.topic_ids.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {rec.topic_ids.map((topicId) => (
                        <button
                          key={topicId}
                          onClick={() => navigate(`/courses/${courseId}/topics/${topicId}/studying`)}
                          className="btn btn-secondary"
                        >
                          Тема {topicId}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button className="btn btn-primary" onClick={() => navigate(`/courses/${courseId}/studying`)}>
              Вернуться к курсу
            </button>
          </div>
          {(moduleKnowledge !== null || courseKnowledge !== null) && (
            <div className="mt-4 text-sm text-gray-700">
              {moduleKnowledge !== null && <p>Обновлённый уровень знаний модуля: <strong>{Math.round(moduleKnowledge)}%</strong></p>}
              {courseKnowledge !== null && <p>Обновлённый уровень знаний курса: <strong>{Math.round(courseKnowledge)}%</strong></p>}
              <p className="mt-2 text-xs text-gray-500">При возвращении на страницу курса показатели будут подтянуты автоматически.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Экран блокировки: тест уже пройден на 100%
  if (alreadyPassed100) {
    return (
      <div className="card text-center">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-green-600">✓ Тест пройден на 100%</h1>
          <p className="text-gray-600 mt-2">Вы уже успешно прошли этот тест с максимальным результатом.</p>
          <p className="text-gray-500 mt-1">Повторное прохождение не требуется.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate(`/courses/${courseId}/studying`)}>
          Вернуться к курсу
        </button>
      </div>
    );
  }

  // Экраны: информация о тесте или сам тест
  if (!testStarted) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <button className="btn btn-secondary" onClick={() => navigate(`/courses/${courseId}/studying`)}>
            ← Назад к курсу
          </button>
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold">{test.name}</h1>
            <p className="text-sm text-gray-600">{test.description}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Продолжительность</div>
            <div className="font-bold">{test.durationInMinutes} мин</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Вопросов: {questions.length}</div>
          <button className="btn btn-primary" onClick={handleStartTest}>Начать тест</button>
        </div>
      </div>
    );
  }

  // Экран прохождения теста
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <button className="btn btn-secondary" onClick={() => navigate(`/courses/${courseId}/studying`)}>← Назад</button>
        <div className="text-center flex-1">
          <h2 className="font-bold">{test.name}</h2>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Время</div>
          <div className="font-bold">{formatTime(elapsedSeconds)}</div>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => {
          const answers = questionAnswers[question.id] || [];
          const userAnswer = userAnswers[question.id];

          return (
            <div key={question.id} className="card">
              <div className="flex items-start justify-between">
                <h3 className="font-bold">Вопрос {index + 1}</h3>
              </div>
              <p className="mt-2 text-gray-700">{question.text}</p>

              {question.picture && (
                <img 
                  src={`/full/questions/${question.id}/picture`}
                  alt="Вопрос"
                  onError={(e) => (e.target.style.display = "none")}
                  className="mt-3 max-h-48 object-contain w-full"
                />
              )}

              {question.questionType === "test" && answers.length > 0 && (
                <div className="mt-3 space-y-2">
                  {answers.map((answer) => (
                    <label key={answer.id} className="flex items-center gap-3 p-2 border rounded hover:bg-gray-50">
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={answer.id}
                        checked={!Array.isArray(userAnswer) && userAnswer === answer.id}
                        onChange={() => handleAnswerChange(question.id, answer.id)}
                        disabled={submitting}
                      />
                      <span>{answer.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.questionType === "open" && (
                <div className="mt-3">
                  <textarea
                    value={userAnswer || ""}
                    onChange={(e) => handleOpenAnswerChange(question.id, e.target.value)}
                    placeholder="Введите ваш ответ..."
                    disabled={submitting}
                    rows={5}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">Время: {formatTime(elapsedSeconds)}</div>
        <button className="btn btn-primary" onClick={handleFinishTest} disabled={submitting}>
          {submitting ? "Отправка..." : "Завершить тест"}
        </button>
      </div>
    </div>
  );
}
