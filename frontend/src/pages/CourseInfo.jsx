import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TeachingApi, FullApi, UsersApi } from "../api";

export default function CourseInfo() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [category, setCategory] = useState(null);
  const [modules, setModules] = useState([]);
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

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!course) return null;

  return (
    <div className="course-info-page">
      <div className="course-header">
        <img
          src={course.picture ? `/full/courses/${course.id}/picture` : "/default.png"}
          alt={course.name}
          onError={(e) => (e.target.src = "/default.png")}
          className="course-cover"
        />
        <div className="course-meta">
          <h1>{course.name}</h1>
          <p className="course-category">
            Категория: {category?.name || "Загрузка..."}
          </p>
          <div className="course-description">
            <h2>Описание</h2>
            <p>{course.description}</p>
          </div>

          <div className="enroll-section">
            {enrolled ? (
              <p className="enrolled-success">✅ Вы уже записаны на этот курс</p>
            ) : (
              <button
                className="enroll-button"
                onClick={handleEnroll}
                disabled={enrolling}
              >
                {enrolling ? "Записываем..." : "Записаться на курс"}
              </button>
            )}
            {enrollError && <p className="error">{enrollError}</p>}
          </div>
        </div>
      </div>

      <div className="modules-section">
        <h2>Программа курса</h2>
        {modules.length === 0 ? (
          <p className="no-modules">Нет модулей</p>
        ) : (
          <div className="modules-grid">
            {modules.map((module) => (
              <div key={module.id} className="module-card">
                <h3>{module.name}</h3>
                <p className="module-desc">
                  {module.description || "Описание отсутствует"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}