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
    return <div className="flex items-center justify-center h-64">Загрузка курсов...</div>;
  }

  return (
    <div>
      <h1 className="mb-4">Все курсы</h1>
      <div className="grid">
        {courses.length === 0 ? (
          <p className="text-secondary">Пока нет доступных курсов.</p>
        ) : (
          courses.map((course) => (
            <div
              key={course.id}
              className="card"
              style={{ cursor: 'pointer', padding: 0, overflow: 'hidden' }}
              onClick={() => navigate(`/courses/${course.id}`)}
            >
              <div style={{ height: '200px', backgroundColor: '#e5e7eb', overflow: 'hidden' }}>
                <img
                  src={course.picture ? `/full/courses/${course.id}/picture` : "/default.png"}
                  alt={course.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => (e.target.src = "https://via.placeholder.com/400x200?text=No+Image")}
                />
              </div>
              <div style={{ padding: '1.5rem' }}>
                <div className="flex justify-between items-start mb-2">
                  <h3 style={{ margin: 0 }}>{course.name}</h3>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    backgroundColor: '#e0e7ff', 
                    color: '#4338ca', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '9999px',
                    whiteSpace: 'nowrap'
                  }}>
                    {course.category?.name || "Без категории"}
                  </span>
                </div>
                <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                  {course.description.length > 100
                    ? course.description.slice(0, 100) + "..."
                    : course.description}
                </p>
                <button className="btn btn-primary" style={{ width: '100%' }}>Подробнее</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CoursesList;