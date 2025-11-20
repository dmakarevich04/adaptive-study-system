import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TeachingApi, FullApi } from "../api/index.js";

function CoursesList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");

    // Создаём экземпляры API внутри эффекта
    const teachingApi = new TeachingApi();
    const fullApi = new FullApi();

    if (token) {
      teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
      fullApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    const fetchCourses = async () => {
      try {
        // Загружаем опубликованные курсы
        const coursesData = await teachingApi.listCoursesFullCoursesGet({ published: true });

        if (!coursesData || coursesData.length === 0) {
          setCourses([]);
          setLoading(false);
          return;
        }

        // Загружаем категории для каждого курса
        const coursesWithCategories = await Promise.all(
          coursesData.map(async (course) => {
            if (!course.categoryId) {
              return { ...course, category: { name: "Без категории" } };
            }

            try {
              const catData = await fullApi.getCategoryFullAdminCategoriesCatIdGet(course.categoryId);
              return { ...course, category: catData };
            } catch (err) {
              console.warn(`Не удалось загрузить категорию ${course.categoryId} для курса ${course.id}`);
              return { ...course, category: { name: "Неизвестная категория" } };
            }
          })
        );

        setCourses(coursesWithCategories);
      } catch (err) {
        console.error("Ошибка при загрузке курсов:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return <div className="loading">Загрузка курсов...</div>;
  }

  return (
    <div className="courses-page">
      <h1 className="courses-title">Все курсы</h1>
      <div className="courses-grid">
        {courses.length === 0 ? (
          <p className="no-courses">Пока нет доступных курсов.</p>
        ) : (
          courses.map((course) => (
            <div
              key={course.id}
              className="course-card"
              onClick={() => navigate(`/courses/${course.id}`)}
            >
              <div className="course-image">
                <img
                  src={course.picture ? `/full/courses/${course.id}/picture` : "/default.png"}
                  alt={course.name}
                  onError={(e) => (e.target.src = "/default.png")}
                />
              </div>
              <div className="course-content">
                <h2 className="course-name">{course.name}</h2>
                <b className="course-category">
                  Категория: {course.category?.name || "Без категории"}
                </b>
                <h4 className="course-desc">
                  {course.description.length > 100
                    ? course.description.slice(0, 100) + "..."
                    : course.description}
                </h4>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CoursesList;