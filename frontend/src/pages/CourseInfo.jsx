import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TeachingApi, FullApi } from "../api";
import "../styles/course_info.css";

export default function CourseInfo() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [category, setCategory] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const teachingApi = new TeachingApi();
  const fullApi = new FullApi();

  const token = localStorage.getItem("jwtToken");
  if (token) {
    teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    fullApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  useEffect(() => {
    const id = Number(courseId);
    if (isNaN(id)) {
      setError("Некорректный ID курса");
      setLoading(false);
      return;
    }

    // Загружаем курс
    teachingApi.getCourseFullCoursesCourseIdGet(id, (err, courseData) => {
      if (err) {
        console.error(err);
        setError("Не удалось загрузить курс");
        setLoading(false);
        return;
      }

      setCourse(courseData);

      // Категория
      if (courseData.categoryId) {
        fullApi.getCategoryFullAdminCategoriesCatIdGet(courseData.categoryId, (err, catData) => {
          setCategory(err ? { name: "Неизвестная категория" } : catData);
        });
      } else {
        setCategory({ name: "Без категории" });
      }

      // Модули
      teachingApi.listModulesForCourseFullCoursesCourseIdModulesGet(id, (err, modulesData) => {
        if (err) {
          if (err.status === 401) {
            localStorage.removeItem("jwtToken");
            navigate("/login");
          }
          setError("Не удалось загрузить модули");
          setLoading(false);
          return;
        }

        setModules(modulesData);
        setLoading(false);
      });
    });
  }, [courseId, navigate]);

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!course) return null;

  return (
    <div className="course-info-page">
      <div className="course-header">
        <img
          src={`http://localhost:8000/${course.picture}`}
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
