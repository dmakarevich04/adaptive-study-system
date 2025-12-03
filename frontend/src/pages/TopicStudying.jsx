import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TeachingApi } from "../api/index.js";

export default function TopicStudying() {
  const { courseId, topicId } = useParams();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [contents, setContents] = useState([]);
  const [contentUrls, setContentUrls] = useState({});
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
        // 1) Сама тема (с проверкой доступа)
        const topicData = await teachingApi.getTopicFullTopicsTopicIdGet(id);
        setTopic(topicData);

        // 2) Материалы темы
        const contentsData = await teachingApi.getTopicContentsFullTopicsTopicIdContentsGet(
          id,
          { courseId: cId }
        );
        setContents(contentsData || []);
      } catch (err) {
        console.error("Ошибка при загрузке темы или материалов:", err);
        if (err.status === 401 || err.status === 403) {
          setError("У вас нет доступа к этой теме");
        } else {
          setError("Не удалось загрузить тему или материалы");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, topicId, token]);

  // Определение типа файла по расширению
  const getFileType = (filePath) => {
    if (!filePath) return "unknown";
    const ext = filePath.split(".").pop().toLowerCase();

    const image = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
    const video = ["mp4", "webm", "ogg", "mov", "avi", "wmv", "flv"];
    const audio = ["mp3", "wav", "ogg", "m4a", "aac", "flac"];

    if (image.includes(ext)) return "image";
    if (video.includes(ext)) return "video";
    if (audio.includes(ext)) return "audio";
    return "file";
  };

  // Красивое имя файла из пути
  const getPrettyFilename = (filePath) => {
    if (!filePath) return "файл";
    const parts = filePath.split(/[\\/]/);
    return parts[parts.length - 1];
  };

  // Загружаем blob-URL для превью изображений/видео/аудио (с авторизацией)
  useEffect(() => {
    const loadPreviews = async () => {
      if (!contents || contents.length === 0) {
        setContentUrls({});
        return;
      }

      const previews = {};

      await Promise.all(
        contents.map(async (c) => {
          if (!c.file) return;
          const type = getFileType(c.file);
          // Для документов blob-URL не нужен, только для медиа
          if (type === "file" || type === "unknown") return;

          try {
            const teachingApi = new TeachingApi();
            const baseUrl = teachingApi.apiClient.basePath || "";
            const downloadUrl = `${baseUrl}/full/topic-contents/${c.id}/download`;
            const resp = await fetch(downloadUrl, {
              headers: token
                ? { Authorization: `Bearer ${token}` }
                : {},
            });
            if (!resp.ok) {
              console.error("Не удалось загрузить превью материала темы", c.id, resp.status);
              return;
            }
            const blob = await resp.blob();

            const objectUrl = window.URL.createObjectURL(blob);
            previews[c.id] = objectUrl;
          } catch (e) {
            console.error(
              "Не удалось загрузить превью материала темы",
              c.id,
              e
            );
          }
        })
      );

      setContentUrls(previews);
    };

    loadPreviews();
  }, [contents, token]);

  // Скачивание файла через API (нужно для корректного имени и типа)
  const handleDownload = async (contentId, filename) => {
    try {
      const teachingApi = new TeachingApi();
      const baseUrl = teachingApi.apiClient.basePath || "";
      const downloadUrl = `${baseUrl}/full/topic-contents/${contentId}/download`;
      const resp = await fetch(downloadUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!resp.ok) {
        alert("Не удалось скачать файл");
        return;
      }

      const blob = await resp.blob();

      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;

      const contentDisposition = resp.headers.get("content-disposition") || "";
      const filenameMatch = contentDisposition.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
      );
      const finalFilename = filenameMatch
        ? filenameMatch[1].replace(/['"]/g, "")
        : filename || "file";

      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(objectUrl);
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
      <div className="topic-header flex items-center justify-between mb-4">
        <button
          className="btn btn-secondary"
          onClick={() => navigate(`/courses/${courseId}/studying`)}
        >
          ← Назад к курсу
        </button>
        {topic && (
          <div className="topic-info ml-4">
            <h1 className="text-2xl font-bold mb-2">{topic.name}</h1>
            {topic.description && (
              <p className="topic-description text-gray-700">{topic.description}</p>
            )}
          </div>
        )}
      </div>

      <div className="topic-contents">
        <h2 className="text-xl font-semibold mb-3">Материалы темы</h2>
        {contents.length === 0 ? (
          <p className="text-gray-600">Нет материалов</p>
        ) : (
          <div className="contents-list space-y-4">
            {contents.map((content) => {
              const fileType = getFileType(content.file);
              const previewUrl = contentUrls[content.id];
              const prettyName = getPrettyFilename(content.file);

              return (
                <div key={content.id} className="content-item card p-4">
                  <div className="content-description mb-2">
                    {content.description && (
                      <p className="text-sm text-gray-800">{content.description}</p>
                    )}
                  </div>

                  {content.file ? (
                    <div className="content-media">
                      {fileType === "image" && (
                        <div className="image-container">
                          <img
                            src={previewUrl}
                            alt={content.description || "Изображение"}
                            className="max-w-full h-auto rounded"
                            onError={(e) => {
                              console.error("Ошибка загрузки изображения");
                              e.target.style.display = "none";
                            }}
                          />
                        </div>
                      )}

                      {fileType === "video" && (
                        <div className="video-container">
                          <video controls className="w-full max-w-2xl rounded">
                            {previewUrl && <source src={previewUrl} />}
                            Ваш браузер не поддерживает видео.
                          </video>
                        </div>
                      )}

                      {fileType === "audio" && (
                        <div className="audio-container">
                          <audio controls className="w-full">
                            {previewUrl && <source src={previewUrl} />}
                            Ваш браузер не поддерживает аудио.
                          </audio>
                        </div>
                      )}

                      {fileType === "file" && (
                        <div className="file-container flex items-center justify-between">
                          <span className="text-sm text-gray-700 mr-3">
                            {prettyName}
                          </span>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleDownload(content.id, prettyName)}
                          >
                            Скачать
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Файл не прикреплён.</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}