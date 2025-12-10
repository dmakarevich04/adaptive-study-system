import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UsersApi, FullApi } from "../api/index.js";

function MyEnrolledCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Функция для форматирования даты
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");

    // Создаём экземпляры API внутри эффекта
    const usersApi = new UsersApi();
    const fullApi = new FullApi();

    if (token) {
      usersApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
      fullApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    const fetchEnrolledCourses = async () => {
      try {
        // Получаем курсы и enrollments параллельно
        const [coursesData, enrollmentsData] = await Promise.all([
          usersApi.myEnrolledCoursesUsersMeCoursesEnrolledGet(),
          usersApi.myEnrollmentsUsersMeEnrollmentsGet()
        ]);

        if (!coursesData || coursesData.length === 0) {
          setCourses([]);
          setLoading(false);
          return;
        }

        // Создаем Map для быстрого поиска enrollment по courseId
        const enrollmentMap = new Map();
        enrollmentsData.forEach(enrollment => {
          enrollmentMap.set(enrollment.courseId, enrollment);
        });

        // Подгружаем категории для каждого курса и добавляем информацию о зачислении
        const coursesWithCategories = await Promise.all(
          coursesData.map(async (course) => {
            const enrollment = enrollmentMap.get(course.id);
            
            let category = { name: "Без категории" };
            if (course.categoryId) {
              try {
                const catData = await fullApi.getCategoryFullAdminCategoriesCatIdGet(course.categoryId);
                category = catData || { name: "Неизвестная категория" };
              } catch (err) {
                console.warn(`Не удалось загрузить категорию ${course.categoryId} для курса ${course.id}`);
              }
            }

            return {
              ...course,
              category,
              enrollment: enrollment || null
            };
          })
        );

        setCourses(coursesWithCategories);
      } catch (err) {
        console.error("Ошибка при загрузке ваших курсов:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Загрузка ваших курсов...</div>;
  }

  return (
    <div>
      <h1 className="mb-4">Мои курсы</h1>
      <div className="grid">
        {courses.length === 0 ? (
          <p className="text-secondary">Вы пока не записаны ни на один курс.</p>
        ) : (
          courses.map((course) => {
            const startDate = course.enrollment?.dateStarted 
              ? formatDate(course.enrollment.dateStarted) 
              : null;
            const endDate = course.enrollment?.dateEnded 
              ? formatDate(course.enrollment.dateEnded) 
              : null;

            return (
              <div
                key={course.id}
                className="card"
                style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ height: '150px', backgroundColor: '#e5e7eb', overflow: 'hidden' }}>
                  <img
                    src={course.picture ? `/full/courses/${course.id}/picture` : "/default.png"}
                    alt={course.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => (e.target.src = "https://via.placeholder.com/400x150?text=No+Image")}
                  />
                </div>
                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ marginBottom: '0.5rem' }}>{course.name}</h3>
                  <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                    Категория: <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">{course.category?.name || "Без категории"}</span>
                  </p>
                  <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '1rem', flex: 1 }}>
                    {course.description?.length > 100
                      ? course.description.slice(0, 100) + "..."
                      : course.description}
                  </p>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '1rem' }}>
                    <div>Дата начала: {startDate || "--"}</div>
                    {endDate && <div>Дата окончания: {endDate}</div>}
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={(e) => {
                      e.stopPropagation(); // Предотвращаем срабатывание onClick на карточке
                      navigate(`/course-studying/${course.id}`);
                    }}
                  >
                    Перейти к изучению
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default MyEnrolledCourses;