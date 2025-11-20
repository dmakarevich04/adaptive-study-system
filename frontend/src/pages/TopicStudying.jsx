import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TeachingApi } from "../api/index.js";

export default function TopicStudying() {
  const { courseId, topicId } = useParams();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("jwtToken");

  useEffect(() => {
    const fetchData = async () => {
      const id = Number(topicId);
      const cId = Number(courseId);
      
      if (isNaN(id) || isNaN(cId)) {
        setError("Некорректный ID темы или курса");
        setLoading(false);
        return;
      }

      const teachingApi = new TeachingApi();

      if (token) {
        teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
      }

      try {
        // Загружаем темы модуля, чтобы найти нужную тему
        // Сначала нужно получить модуль, но проще загрузить все темы всех модулей курса
        // Или найти нужную тему по ID - но для этого нужен эндпоинт getTopic
        // Пока будем загружать содержимое и использовать информацию из него

        // Загружаем материалы темы
        const contentsData = await teachingApi.getTopicContentsFullTopicsTopicIdContentsGet(
          id,
          { courseId: cId }
        );
        setContents(contentsData || []);

        // Для получения информации о теме нужно будет загрузить все модули и их темы
        // Но это может быть неэффективно. Попробуем другой подход.
        // Попробуем загрузить модули курса и найти тему среди них
        const modules = await teachingApi.listModulesForCourseFullCoursesCourseIdModulesGet(cId);
        
        let foundTopic = null;
        for (const module of modules) {
          try {
            const topics = await teachingApi.listTopicsFullCoursesCourseIdModulesModuleIdTopicsGet(
              cId,
              module.id
            );
            const topicData = topics.find(t => t.id === id);
            if (topicData) {
              foundTopic = topicData;
              break;
            }
          } catch (err) {
            console.error("Ошибка загрузки тем модуля:", err);
          }
        }

        if (foundTopic) {
          setTopic(foundTopic);
        }
      } catch (err) {
        console.error("Ошибка при загрузке темы:", err);
        if (err.status === 401 || err.status === 403) {
          setError("У вас нет доступа к этой теме");
        } else {
          setError("Не удалось загрузить тему");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, topicId, token]);

  // Функция для определения типа файла по расширению
  const getFileType = (filePath) => {
    if (!filePath) return "unknown";
    const extension = filePath.split('.').pop().toLowerCase();
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', 'flv'];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
    
    if (imageExtensions.includes(extension)) return "image";
    if (videoExtensions.includes(extension)) return "video";
    if (audioExtensions.includes(extension)) return "audio";
    return "file";
  };

  // Функция для получения URL файла
  const getFileUrl = (contentId) => {
    return `/full/topic-contents/${contentId}/download`;
  };

  // Функция для скачивания файла
  const handleDownload = async (contentId, filename) => {
    try {
      const teachingApi = new TeachingApi();
      if (token) {
        teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await teachingApi.downloadTopicContentFullTopicContentsContentIdDownloadGetWithHttpInfo(contentId);
      
      const blob = response.body instanceof Blob 
        ? response.body 
        : new Blob([response.body], { type: response.headers['content-type'] || 'application/octet-stream' });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const contentDisposition = response.headers['content-disposition'] || '';
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      const finalFilename = filenameMatch ? filenameMatch[1].replace(/['"]/g, '') : (filename || 'file');
      
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Ошибка скачивания файла:", err);
      alert("Не удалось скачать файл");
    }
  };

  if (loading) {
    return <div className="loading">Загрузка темы...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={() => navigate(`/courses/${courseId}/studying`)}>
          Вернуться к курсу
        </button>
      </div>
    );
  }

  return (
    <div className="topic-studying-page">
      <div className="topic-header">
        <button onClick={() => navigate(`/courses/${courseId}/studying`)}>
          ← Назад к курсу
        </button>
        {topic && (
          <div className="topic-info">
            <h1>{topic.name}</h1>
            <p className="topic-description">{topic.description}</p>
          </div>
        )}
      </div>

      <div className="topic-contents">
        <h2>Материалы темы</h2>
        {contents.length === 0 ? (
          <p>Нет материалов</p>
        ) : (
          <div className="contents-list">
            {contents.map((content) => {
              const fileType = getFileType(content.file);
              const fileUrl = getFileUrl(content.id);

              return (
                <div key={content.id} className="content-item">
                  <div className="content-description">
                    {content.description && <p>{content.description}</p>}
                  </div>

                  <div className="content-media">
                    {fileType === "image" && (
                      <div className="image-container">
                        <img 
                          src={fileUrl}
                          alt={content.description || "Изображение"}
                          onError={(e) => {
                            console.error("Ошибка загрузки изображения");
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    )}

                    {fileType === "video" && (
                      <div className="video-container">
                        <video controls>
                          <source src={fileUrl} type="video/mp4" />
                          <source src={fileUrl} type="video/webm" />
                          <source src={fileUrl} type="video/ogg" />
                          Ваш браузер не поддерживает видео.
                        </video>
                      </div>
                    )}

                    {fileType === "audio" && (
                      <div className="audio-container">
                        <audio controls>
                          <source src={fileUrl} type="audio/mpeg" />
                          <source src={fileUrl} type="audio/wav" />
                          <source src={fileUrl} type="audio/ogg" />
                          Ваш браузер не поддерживает аудио.
                        </audio>
                      </div>
                    )}

                    {fileType === "file" && (
                      <div className="file-container">
                        <button onClick={() => handleDownload(content.id, content.file)}>
                          Скачать файл
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
