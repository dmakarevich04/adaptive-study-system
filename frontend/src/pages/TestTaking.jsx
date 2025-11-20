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

      // Вычисляем время прохождения в минутах
      // Если меньше 1 минуты (60 секунд), записываем 0, иначе округляем вниз до целых минут
      const timeSpentInMinutes = elapsedSeconds < 60 ? 0 : Math.floor(elapsedSeconds / 60);

      console.log("Отправляемые ответы:", answersToSubmit);
      console.log("Время прохождения (секунды):", elapsedSeconds);
      console.log("Время прохождения (минуты):", timeSpentInMinutes);

      // Отправляем тест с временем прохождения
      // Нужно передать время в теле запроса вместе с ответами
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
      <div className="error">
        <p>{error}</p>
        <button onClick={() => navigate(`/courses/${courseId}/studying`)}>
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
    
    return (
      <div className="test-taking-page">
        <div className="test-result">
          <h1>Тест завершен!</h1>
          <p>Результат: {percent}%</p>
          <p>Правильных ответов: {score} из {questions.length}</p>
          <p>Статус: {isPassed ? "Пройден" : "Не пройден"}</p>
          <p>Время прохождения: {formatTime(finalTime)}</p>
          
          {/* Отображение рекомендаций */}
          {recommendations.length > 0 && (
            <div className="recommendations">
              <h2>Рекомендации:</h2>
              {recommendations.map((rec, index) => (
                <div key={index} className={`recommendation recommendation-${rec.type}`}>
                  <p>{rec.message}</p>
                  {/* Если есть topic_ids, можно добавить ссылки на темы */}
                  {rec.topic_ids && rec.topic_ids.length > 0 && (
                    <div className="topic-links">
                      {rec.topic_ids.map((topicId) => (
                        <button
                          key={topicId}
                          onClick={() => navigate(`/courses/${courseId}/topics/${topicId}/studying`)}
                          className="topic-link-button"
                        >
                          Перейти к теме {topicId}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <button onClick={() => navigate(`/courses/${courseId}/studying`)}>
            Вернуться к курсу
          </button>
        </div>
      </div>
    );
  }

  // Экраны: информация о тесте или сам тест
  if (!testStarted) {
    return (
      <div className="test-taking-page">
        <div className="test-info">
          <button onClick={() => navigate(`/courses/${courseId}/studying`)}>
            ← Назад к курсу
          </button>
          <h1>{test.name}</h1>
          <p className="test-description">{test.description}</p>
          <p className="test-duration">Продолжительность: {test.durationInMinutes} минут</p>
          <p className="test-questions-count">Вопросов: {questions.length}</p>
          <button className="start-test-button" onClick={handleStartTest}>
            Начать тест
          </button>
        </div>
      </div>
    );
  }

  // Экран прохождения теста
  return (
    <div className="test-taking-page">
      <div className="test-header">
        <button onClick={() => navigate(`/courses/${courseId}/studying`)}>
          ← Назад к курсу
        </button>
        <h1>{test.name}</h1>
        <div className="test-timer">
          <span>Время: {formatTime(elapsedSeconds)}</span>
        </div>
      </div>

      <div className="test-questions">
        {questions.map((question, index) => {
          const answers = questionAnswers[question.id] || [];
          const userAnswer = userAnswers[question.id];

          return (
            <div key={question.id} className="question-item">
              <h3>Вопрос {index + 1}</h3>
              <p className="question-text">{question.text}</p>
              
              {question.picture && (
                <img 
                  src={`/full/questions/${question.id}/picture`}
                  alt="Вопрос"
                  onError={(e) => (e.target.style.display = "none")}
                />
              )}

              {question.questionType === "test" && answers.length > 0 && (
                <div className="answers-list">
                  {answers.map((answer) => {
                    // Определяем, нужны ли чекбоксы (множественный выбор) или радиокнопки
                    // Пока используем радиокнопки, так как бэкенд поддерживает только один ответ
                    // Но можно добавить поддержку множественного выбора в будущем
                    const isChecked = Array.isArray(userAnswer) 
                      ? userAnswer.includes(answer.id)
                      : userAnswer === answer.id;

                    return (
                      <label key={answer.id} className="answer-option">
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
                    );
                  })}
                </div>
              )}

              {question.questionType === "open" && (
                <div className="open-answer">
                  <textarea
                    value={userAnswer || ""}
                    onChange={(e) => handleOpenAnswerChange(question.id, e.target.value)}
                    placeholder="Введите ваш ответ..."
                    disabled={submitting}
                    rows={5}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="test-footer">
        <div className="test-timer-footer">
          <span>Время: {formatTime(elapsedSeconds)}</span>
        </div>
        <button 
          className="finish-test-button" 
          onClick={handleFinishTest}
          disabled={submitting}
        >
          {submitting ? "Отправка..." : "Завершить тест"}
        </button>
      </div>
    </div>
  );
}
