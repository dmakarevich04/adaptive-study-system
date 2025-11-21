import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TeachingApi, FullApi, UsersApi } from "../api";

export default function CourseInfo() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [category, setCategory] = useState(null);
  const [modules, setModules] = useState([]);
  const [courseKnowledge, setCourseKnowledge] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [enrollError, setEnrollError] = useState(null);

  // Инициализация API с токеном
  const token = localStorage.getItem("jwtToken");

  useEffect(() => {
    const fetchData = async () => {
      const id = Number(courseId);
      if (isNaN(id)) {
        setError("Некорректный ID курса");
        setLoading(false);
        return;
      }

      // Создаем экземпляры API с авторизацией
      const teachingApi = new TeachingApi();
      const fullApi = new FullApi();
      const usersApi = new UsersApi();

      if (token) {
        teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
        fullApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
        usersApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
      }

      try {
        // Проверка записи на курс
        let enrolledCourses;
        try {
          enrolledCourses = await usersApi.myEnrolledCoursesUsersMeCoursesEnrolledGet();
        } catch (err) {
          console.error("Ошибка при получении списка курсов студента:", err);
          if (err.status === 401) {
            localStorage.removeItem("jwtToken");
            navigate("/login");
            return;
          }
          // Не прерываем загрузку курса, даже если не удалось проверить запись
        }

        const isAlreadyEnrolled = enrolledCourses?.some((c) => c.id === id) || false;
        setEnrolled(isAlreadyEnrolled);

        // Загрузка курса
        const courseData = await teachingApi.getCourseFullCoursesCourseIdGet(id);
        setCourse(courseData);

        // Загрузка категории
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

        // Загрузка модулей
        const modulesData = await teachingApi.listModulesForCourseFullCoursesCourseIdModulesGet(id);
        setModules(modulesData);

        // Если пользователь записан — загрузим уровень знаний по курсу (мой уровень)
        try {
          const knowledgeData = await fullApi.myCourseKnowledgeFullMeCoursesKnowledgeGet();
          const courseKnowledgeItem = knowledgeData.find(k => k.courseId === id);
          if (courseKnowledgeItem && courseKnowledgeItem.knowledge !== undefined) {
            setCourseKnowledge(Math.round(courseKnowledgeItem.knowledge));
          } else {
            setCourseKnowledge(0);
          }
        } catch (err) {
          console.error("Ошибка загрузки уровня знаний курса:", err);
          setCourseKnowledge(0);
        }
      } catch (err) {
        console.error("Ошибка при загрузке курса:", err);
        if (err.status === 401) {
          localStorage.removeItem("jwtToken");
          navigate("/login");
          return;
        }
        setError("Не удалось загрузить курс");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, navigate, token]);

  const handleEnroll = async () => {
    setEnrolling(true);
    setEnrollError(null);

    const fullApi = new FullApi();
    if (token) {
      fullApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
      await fullApi.enrollCourseFullCoursesCourseIdEnrollPost(Number(courseId));
      setEnrolled(true);
    } catch (err) {
      console.error(err);
      if (err.status === 401) {
        localStorage.removeItem("jwtToken");
        navigate("/login");
      } else if (err.status === 400 || err.status === 409) {
        setEnrollError("Вы уже записаны на этот курс");
        setEnrolled(true);
      } else {
        setEnrollError("Не удалось записаться на курс");
      }
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64">Загрузка...</div>;
  if (error) return <div className="text-center text-red-600 mt-4">{error}</div>;
  if (!course) return null;

  return (
    <div className="">
      <div className="card flex gap-4 items-start">
        <div className="overflow-hidden rounded-lg" style={{ width: 150, height: 150, flexShrink: 0 }}>
          <img
            src={course.picture ? `/full/courses/${course.id}/picture` : "/default.png"}
            alt={course.name}
            onError={(e) => (e.target.src = "https://via.placeholder.com/150?text=No+Image")}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{course.name}</h1>
              <div className="mt-2">
                <span className="text-sm text-gray-600">Категория: </span>
                <span className="text-sm font-medium text-blue-800">{category?.name || "Загрузка..."}</span>
              </div>
            </div>
            <div className="text-right">
              {enrolled ? (
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-2 rounded-lg">
                  <span>✅</span>
                  <span className="font-medium">Вы записаны</span>
                </div>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleEnroll}
                  disabled={enrolling}
                >
                  {enrolling ? "Записываем..." : "Записаться"}
                </button>
              )}
            </div>
          </div>

            <p className="mt-4 text-gray-600" style={{ lineHeight: 1.6 }}>{course.description}</p>

            {enrolled && (
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-2">Прогресс курса: {courseKnowledge}%</div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${courseKnowledge}%` }} />
                </div>
              </div>
            )}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-4">Программа курса</h2>
        {modules.length === 0 ? (
          <p className="text-gray-600">Нет модулей</p>
        ) : (
          <div className="grid">
            {modules.map((module) => (
              <div key={module.id} className="card flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{module.name}</h3>
                  <p className="text-sm text-gray-600">{module.description || "Описание отсутствует"}</p>
                </div>
                <div>
                  {enrolled ? (
                    <button
                      className="btn btn-secondary"
                      onClick={() => navigate(`/courses/${courseId}/modules/${module.id}/topics`)}
                    >
                      Начать модуль
                    </button>
                  ) : (
                    <button className="btn btn-secondary" disabled>
                      Доступ с записью
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}