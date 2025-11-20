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
    return <div className="loading">Загрузка ваших курсов...</div>;
  }

  return (
    <div className="my-courses-page">
      <h1 className="courses-title">Мои курсы</h1>
      <div className="my-courses-grid">
        {courses.length === 0 ? (
          <p className="no-courses">Вы пока не записаны ни на один курс.</p>
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
                className="course-card horizontal-card"
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
                  <h3>{course.name}</h3>
                  <p className="course-category">
                    Категория: {course.category?.name || "Без категории"}
                  </p>
                  <p className="course-desc">
                    {course.description?.length > 100
                      ? course.description.slice(0, 100) + "..."
                      : course.description}
                  </p>
                  <div className="course-footer">
                    <span className="course-dates">
                      Дата начала: {startDate || "--"}
                    </span>
                    {endDate && (
                      <span className="course-dates">
                        Дата окончания: {endDate}
                      </span>
                    )}
                  </div>
                  <button
                    className="study-button"
                    onClick={(e) => {
                      e.stopPropagation(); // Предотвращаем срабатывание onClick на карточке
                      navigate(`/courses/${course.id}/studying`);
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