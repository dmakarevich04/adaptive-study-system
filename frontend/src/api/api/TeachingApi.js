import ApiClient from "../ApiClient";
import AnswerCreate from '../model/AnswerCreate';
import AnswerRead from '../model/AnswerRead';
import CourseCreate from '../model/CourseCreate';
import CourseRead from '../model/CourseRead';
import ModuleCreate from '../model/ModuleCreate';
import ModuleRead from '../model/ModuleRead';
import QuestionCreate from '../model/QuestionCreate';
import QuestionRead from '../model/QuestionRead';
import TestCreate from '../model/TestCreate';
import TestRead from '../model/TestRead';
import TestResultRead from '../model/TestResultRead';
import TopicContentCreate from '../model/TopicContentCreate';
import TopicContentRead from '../model/TopicContentRead';
import TopicCreate from '../model/TopicCreate';
import TopicRead from '../model/TopicRead';

export default class TeachingApi {

    /**
    * Constructs a new TeachingApi. 
    * @alias module:api/TeachingApi
    * @class
    * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
    * default to {@link module:ApiClient#instance} if unspecified.
    */
    constructor(apiClient) {
        this.apiClient = apiClient || ApiClient.instance;
    }

    createAnswerFullAnswersPost(answerCreate, callback) {
      let postBody = answerCreate;
      // verify the required parameter 'answerCreate' is set
      if (answerCreate === undefined || answerCreate === null) {
        throw new Error("Missing the required parameter 'answerCreate' when calling createAnswerFullAnswersPost");
      }

      let pathParams = {
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = ['application/json'];
      let accepts = ['application/json'];
      let returnType = AnswerRead;
      return this.apiClient.callApi(
        '/full/answers', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    createCourseFullCoursesPost(courseCreate, callback) {
      let postBody = courseCreate;
      // verify the required parameter 'courseCreate' is set
      if (courseCreate === undefined || courseCreate === null) {
        throw new Error("Missing the required parameter 'courseCreate' when calling createCourseFullCoursesPost");
      }

      let pathParams = {
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = ['application/json'];
      let accepts = ['application/json'];
      let returnType = CourseRead;
      return this.apiClient.callApi(
        '/full/courses', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    createModuleFullModulesPost(moduleCreate, callback) {
      let postBody = moduleCreate;
      // verify the required parameter 'moduleCreate' is set
      if (moduleCreate === undefined || moduleCreate === null) {
        throw new Error("Missing the required parameter 'moduleCreate' when calling createModuleFullModulesPost");
      }

      let pathParams = {
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = ['application/json'];
      let accepts = ['application/json'];
      let returnType = ModuleRead;
      return this.apiClient.callApi(
        '/full/modules', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    createQuestionFullQuestionsPost(questionCreate, callback) {
      let postBody = questionCreate;
      // verify the required parameter 'questionCreate' is set
      if (questionCreate === undefined || questionCreate === null) {
        throw new Error("Missing the required parameter 'questionCreate' when calling createQuestionFullQuestionsPost");
      }

      let pathParams = {
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = ['application/json'];
      let accepts = ['application/json'];
      let returnType = QuestionRead;
      return this.apiClient.callApi(
        '/full/questions', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    createTestFullTestsPost(testCreate, callback) {
      let postBody = testCreate;
      // verify the required parameter 'testCreate' is set
      if (testCreate === undefined || testCreate === null) {
        throw new Error("Missing the required parameter 'testCreate' when calling createTestFullTestsPost");
      }

      let pathParams = {
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = ['application/json'];
      let accepts = ['application/json'];
      let returnType = TestRead;
      return this.apiClient.callApi(
        '/full/tests', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    createTopicFullTopicsPost(topicCreate, callback) {
      let postBody = topicCreate;
      // verify the required parameter 'topicCreate' is set
      if (topicCreate === undefined || topicCreate === null) {
        throw new Error("Missing the required parameter 'topicCreate' when calling createTopicFullTopicsPost");
      }

      let pathParams = {
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = ['application/json'];
      let accepts = ['application/json'];
      let returnType = TopicRead;
      return this.apiClient.callApi(
        '/full/topics', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    deleteAnswerFullAnswersAnswerIdDelete(answerId, callback) {
      let postBody = null;
      // verify the required parameter 'answerId' is set
      if (answerId === undefined || answerId === null) {
        throw new Error("Missing the required parameter 'answerId' when calling deleteAnswerFullAnswersAnswerIdDelete");
      }

      let pathParams = {
        'answer_id': answerId
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = Object;
      return this.apiClient.callApi(
        '/full/answers/{answer_id}', 'DELETE',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }


    deleteCourseFullCoursesCourseIdDelete(courseId, callback) {
      let postBody = null;
      // verify the required parameter 'courseId' is set
      if (courseId === undefined || courseId === null) {
        throw new Error("Missing the required parameter 'courseId' when calling deleteCourseFullCoursesCourseIdDelete");
      }

      let pathParams = {
        'course_id': courseId
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = Object;
      return this.apiClient.callApi(
        '/full/courses/{course_id}', 'DELETE',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }


    deleteModuleFullModulesModuleIdDelete(moduleId, callback) {
      let postBody = null;
      // verify the required parameter 'moduleId' is set
      if (moduleId === undefined || moduleId === null) {
        throw new Error("Missing the required parameter 'moduleId' when calling deleteModuleFullModulesModuleIdDelete");
      }

      let pathParams = {
        'module_id': moduleId
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = Object;
      return this.apiClient.callApi(
        '/full/modules/{module_id}', 'DELETE',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    deleteQuestionFullQuestionsQuestionIdDelete(questionId, callback) {
      let postBody = null;
      // verify the required parameter 'questionId' is set
      if (questionId === undefined || questionId === null) {
        throw new Error("Missing the required parameter 'questionId' when calling deleteQuestionFullQuestionsQuestionIdDelete");
      }

      let pathParams = {
        'question_id': questionId
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = Object;
      return this.apiClient.callApi(
        '/full/questions/{question_id}', 'DELETE',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }


    deleteTestFullTestsTestIdDelete(testId, callback) {
      let postBody = null;
      // verify the required parameter 'testId' is set
      if (testId === undefined || testId === null) {
        throw new Error("Missing the required parameter 'testId' when calling deleteTestFullTestsTestIdDelete");
      }

      let pathParams = {
        'test_id': testId
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = Object;
      return this.apiClient.callApi(
        '/full/tests/{test_id}', 'DELETE',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    
    deleteTopicContentFullTopicContentsContentIdDelete(contentId, callback) {
      let postBody = null;
      // verify the required parameter 'contentId' is set
      if (contentId === undefined || contentId === null) {
        throw new Error("Missing the required parameter 'contentId' when calling deleteTopicContentFullTopicContentsContentIdDelete");
      }

      let pathParams = {
        'content_id': contentId
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = Object;
      return this.apiClient.callApi(
        '/full/topic-contents/{content_id}', 'DELETE',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    
    deleteTopicFullTopicsTopicIdDelete(topicId, callback) {
      let postBody = null;
      // verify the required parameter 'topicId' is set
      if (topicId === undefined || topicId === null) {
        throw new Error("Missing the required parameter 'topicId' when calling deleteTopicFullTopicsTopicIdDelete");
      }

      let pathParams = {
        'topic_id': topicId
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = Object;
      return this.apiClient.callApi(
        '/full/topics/{topic_id}', 'DELETE',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    downloadTopicContentFullTopicContentsContentIdDownloadGet(contentId, callback) {
      let postBody = null;
      // verify the required parameter 'contentId' is set
      if (contentId === undefined || contentId === null) {
        throw new Error("Missing the required parameter 'contentId' when calling downloadTopicContentFullTopicContentsContentIdDownloadGet");
      }

      let pathParams = {
        'content_id': contentId
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = Object;
      return this.apiClient.callApi(
        '/full/topic-contents/{content_id}/download', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    getAnswerFullAnswersAnswerIdGet(answerId, callback) {
      let postBody = null;
      // verify the required parameter 'answerId' is set
      if (answerId === undefined || answerId === null) {
        throw new Error("Missing the required parameter 'answerId' when calling getAnswerFullAnswersAnswerIdGet");
      }

      let pathParams = {
        'answer_id': answerId
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = [];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = AnswerRead;
      return this.apiClient.callApi(
        '/full/answers/{answer_id}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    getCourseFullCoursesCourseIdGet(courseId, callback) {
      let postBody = null;
      // verify the required parameter 'courseId' is set
      if (courseId === undefined || courseId === null) {
        throw new Error("Missing the required parameter 'courseId' when calling getCourseFullCoursesCourseIdGet");
      }

      let pathParams = {
        'course_id': courseId
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = [];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = CourseRead;
      return this.apiClient.callApi(
        '/full/courses/{course_id}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    getModuleFullModulesModuleIdGet(moduleId, callback) {
      let postBody = null;
      // verify the required parameter 'moduleId' is set
      if (moduleId === undefined || moduleId === null) {
        throw new Error("Missing the required parameter 'moduleId' when calling getModuleFullModulesModuleIdGet");
      }

      let pathParams = {
        'module_id': moduleId
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = [];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = ModuleRead;
      return this.apiClient.callApi(
        '/full/modules/{module_id}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    getQuestionFullQuestionsQuestionIdGet(questionId, callback) {
      let postBody = null;
      // verify the required parameter 'questionId' is set
      if (questionId === undefined || questionId === null) {
        throw new Error("Missing the required parameter 'questionId' when calling getQuestionFullQuestionsQuestionIdGet");
      }

      let pathParams = {
        'question_id': questionId
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = [];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = QuestionRead;
      return this.apiClient.callApi(
        '/full/questions/{question_id}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    
    getTestFullTestsTestIdGet(testId, callback) {
      let postBody = null;
      // verify the required parameter 'testId' is set
      if (testId === undefined || testId === null) {
        throw new Error("Missing the required parameter 'testId' when calling getTestFullTestsTestIdGet");
      }

      let pathParams = {
        'test_id': testId
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = [];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = TestRead;
      return this.apiClient.callApi(
        '/full/tests/{test_id}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    getTopicContentFullTopicContentsContentIdGet(contentId, opts, callback) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'contentId' is set
      if (contentId === undefined || contentId === null) {
        throw new Error("Missing the required parameter 'contentId' when calling getTopicContentFullTopicContentsContentIdGet");
      }

      let pathParams = {
        'content_id': contentId
      };
      let queryParams = {
        'course_id': opts['courseId']
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = TopicContentRead;
      return this.apiClient.callApi(
        '/full/topic-contents/{content_id}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }


    getTopicContentsFullTopicsTopicIdContentsGet(topicId, opts, callback) {
      opts = opts || {};
      let postBody = null;
      // verify the required parameter 'topicId' is set
      if (topicId === undefined || topicId === null) {
        throw new Error("Missing the required parameter 'topicId' when calling getTopicContentsFullTopicsTopicIdContentsGet");
      }

      let pathParams = {
        'topic_id': topicId
      };
      let queryParams = {
        'course_id': opts['courseId']
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = [TopicContentRead];
      return this.apiClient.callApi(
        '/full/topics/{topic_id}/contents', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    
    getTopicFullTopicsTopicIdGet(topicId, callback) {
      let postBody = null;
      // verify the required parameter 'topicId' is set
      if (topicId === undefined || topicId === null) {
        throw new Error("Missing the required parameter 'topicId' when calling getTopicFullTopicsTopicIdGet");
      }

      let pathParams = {
        'topic_id': topicId
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = TopicRead;
      return this.apiClient.callApi(
        '/full/topics/{topic_id}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    listAnswersFullQuestionsQuestionIdAnswersGet(questionId, callback) {
      let postBody = null;
      // verify the required parameter 'questionId' is set
      if (questionId === undefined || questionId === null) {
        throw new Error("Missing the required parameter 'questionId' when calling listAnswersFullQuestionsQuestionIdAnswersGet");
      }

      let pathParams = {
        'question_id': questionId
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = [];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = [AnswerRead];
      return this.apiClient.callApi(
        '/full/questions/{question_id}/answers', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    
    listCoursesFullCoursesGet(opts, callback) {
      opts = opts || {};
      let postBody = null;

      let pathParams = {
      };
      let queryParams = {
        'published': opts['published'],
        'authorId': opts['authorId'],
        'categoryId': opts['categoryId'],
        'limit': opts['limit'],
        'offset': opts['offset']
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = [];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = [CourseRead];
      return this.apiClient.callApi(
        '/full/courses', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the listModulesForCourseFullCoursesCourseIdModulesGet operation.
     * @callback module:api/TeachingApi~listModulesForCourseFullCoursesCourseIdModulesGetCallback
     * @param {String} error Error message, if any.
     * @param {Array.<module:model/ModuleRead>} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Перечислить модули курса
     * Возвращает все модули указанного курса в порядке их идентификаторов.
     * @param {Number} courseId 
     * @param {module:api/TeachingApi~listModulesForCourseFullCoursesCourseIdModulesGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Array.<module:model/ModuleRead>}
     */
    listModulesForCourseFullCoursesCourseIdModulesGet(courseId, callback) {
      let postBody = null;
      // verify the required parameter 'courseId' is set
      if (courseId === undefined || courseId === null) {
        throw new Error("Missing the required parameter 'courseId' when calling listModulesForCourseFullCoursesCourseIdModulesGet");
      }

      let pathParams = {
        'course_id': courseId
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = [];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = [ModuleRead];
      return this.apiClient.callApi(
        '/full/courses/{course_id}/modules', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the listQuestionsFullTestsTestIdQuestionsGet operation.
     * @callback module:api/TeachingApi~listQuestionsFullTestsTestIdQuestionsGetCallback
     * @param {String} error Error message, if any.
     * @param {Array.<module:model/QuestionRead>} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Перечислить вопросы теста
     * Возвращает все вопросы указанного теста.
     * @param {Number} testId 
     * @param {module:api/TeachingApi~listQuestionsFullTestsTestIdQuestionsGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Array.<module:model/QuestionRead>}
     */
    listQuestionsFullTestsTestIdQuestionsGet(testId, callback) {
      let postBody = null;
      // verify the required parameter 'testId' is set
      if (testId === undefined || testId === null) {
        throw new Error("Missing the required parameter 'testId' when calling listQuestionsFullTestsTestIdQuestionsGet");
      }

      let pathParams = {
        'test_id': testId
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = [];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = [QuestionRead];
      return this.apiClient.callApi(
        '/full/tests/{test_id}/questions', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the listResultsForTestFullTestsTestIdResultsGet operation.
     * @callback module:api/TeachingApi~listResultsForTestFullTestsTestIdResultsGetCallback
     * @param {String} error Error message, if any.
     * @param {Array.<module:model/TestResultRead>} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Результаты теста
     * Перечисляет результаты прохождения теста для администратора или автора курса.
     * @param {Number} testId 
     * @param {module:api/TeachingApi~listResultsForTestFullTestsTestIdResultsGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Array.<module:model/TestResultRead>}
     */
    listResultsForTestFullTestsTestIdResultsGet(testId, callback) {
      let postBody = null;
      // verify the required parameter 'testId' is set
      if (testId === undefined || testId === null) {
        throw new Error("Missing the required parameter 'testId' when calling listResultsForTestFullTestsTestIdResultsGet");
      }

      let pathParams = {
        'test_id': testId
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = [TestResultRead];
      return this.apiClient.callApi(
        '/full/tests/{test_id}/results', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the listTestsFullTestsGet operation.
     * @callback module:api/TeachingApi~listTestsFullTestsGetCallback
     * @param {String} error Error message, if any.
     * @param {Array.<module:model/TestRead>} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Список тестов
     * Возвращает тесты с фильтрами по курсу и модулю.
     * @param {Object} opts Optional parameters
     * @param {Number} [courseId] 
     * @param {Number} [moduleId] 
     * @param {module:api/TeachingApi~listTestsFullTestsGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Array.<module:model/TestRead>}
     */
    listTestsFullTestsGet(opts, callback) {
      opts = opts || {};
      let postBody = null;

      let pathParams = {
      };
      let queryParams = {
        'course_id': opts['courseId'],
        'module_id': opts['moduleId']
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = [];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = [TestRead];
      return this.apiClient.callApi(
        '/full/tests', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the listTopicsFullCoursesCourseIdModulesModuleIdTopicsGet operation.
     * @callback module:api/TeachingApi~listTopicsFullCoursesCourseIdModulesModuleIdTopicsGetCallback
     * @param {String} error Error message, if any.
     * @param {Array.<module:model/TopicRead>} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Список тем модуля
     * Возвращает темы модуля с проверкой доступа и прогресса студента.
     * @param {Number} courseId 
     * @param {Number} moduleId 
     * @param {module:api/TeachingApi~listTopicsFullCoursesCourseIdModulesModuleIdTopicsGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Array.<module:model/TopicRead>}
     */
    listTopicsFullCoursesCourseIdModulesModuleIdTopicsGet(courseId, moduleId, callback) {
      let postBody = null;
      // verify the required parameter 'courseId' is set
      if (courseId === undefined || courseId === null) {
        throw new Error("Missing the required parameter 'courseId' when calling listTopicsFullCoursesCourseIdModulesModuleIdTopicsGet");
      }
      // verify the required parameter 'moduleId' is set
      if (moduleId === undefined || moduleId === null) {
        throw new Error("Missing the required parameter 'moduleId' when calling listTopicsFullCoursesCourseIdModulesModuleIdTopicsGet");
      }

      let pathParams = {
        'course_id': courseId,
        'module_id': moduleId
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = [TopicRead];
      return this.apiClient.callApi(
        '/full/courses/{course_id}/modules/{module_id}/topics', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the publishCourseFullCoursesCourseIdPublishPatch operation.
     * @callback module:api/TeachingApi~publishCourseFullCoursesCourseIdPublishPatchCallback
     * @param {String} error Error message, if any.
     * @param {Object} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Опубликовать или скрыть курс
     * Переключает флаг публикации курса. Доступно только автору курса.
     * @param {Number} courseId 
     * @param {Boolean} publish 
     * @param {module:api/TeachingApi~publishCourseFullCoursesCourseIdPublishPatchCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Object}
     */
    publishCourseFullCoursesCourseIdPublishPatch(courseId, publish, callback) {
      let postBody = null;
      // verify the required parameter 'courseId' is set
      if (courseId === undefined || courseId === null) {
        throw new Error("Missing the required parameter 'courseId' when calling publishCourseFullCoursesCourseIdPublishPatch");
      }
      // verify the required parameter 'publish' is set
      if (publish === undefined || publish === null) {
        throw new Error("Missing the required parameter 'publish' when calling publishCourseFullCoursesCourseIdPublishPatch");
      }

      let pathParams = {
        'course_id': courseId
      };
      let queryParams = {
        'publish': publish
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = [];
      let accepts = ['application/json'];
      let returnType = Object;
      return this.apiClient.callApi(
        '/full/courses/{course_id}/publish', 'PATCH',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the updateAnswerFullAnswersAnswerIdPut operation.
     * @callback module:api/TeachingApi~updateAnswerFullAnswersAnswerIdPutCallback
     * @param {String} error Error message, if any.
     * @param {module:model/AnswerRead} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Обновить ответ
     * Изменяет текст и правильность ответа. Доступно только автору курса.
     * @param {Number} answerId 
     * @param {module:model/AnswerCreate} answerCreate 
     * @param {module:api/TeachingApi~updateAnswerFullAnswersAnswerIdPutCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/AnswerRead}
     */
    updateAnswerFullAnswersAnswerIdPut(answerId, answerCreate, callback) {
      let postBody = answerCreate;
      // verify the required parameter 'answerId' is set
      if (answerId === undefined || answerId === null) {
        throw new Error("Missing the required parameter 'answerId' when calling updateAnswerFullAnswersAnswerIdPut");
      }
      // verify the required parameter 'answerCreate' is set
      if (answerCreate === undefined || answerCreate === null) {
        throw new Error("Missing the required parameter 'answerCreate' when calling updateAnswerFullAnswersAnswerIdPut");
      }

      let pathParams = {
        'answer_id': answerId
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = ['application/json'];
      let accepts = ['application/json'];
      let returnType = AnswerRead;
      return this.apiClient.callApi(
        '/full/answers/{answer_id}', 'PUT',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the updateCourseFullCoursesCourseIdPut operation.
     * @callback module:api/TeachingApi~updateCourseFullCoursesCourseIdPutCallback
     * @param {String} error Error message, if any.
     * @param {module:model/CourseRead} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Обновить курс
     * Изменяет основные поля курса. Доступно только автору курса.
     * @param {Number} courseId 
     * @param {module:model/CourseCreate} courseCreate 
     * @param {module:api/TeachingApi~updateCourseFullCoursesCourseIdPutCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/CourseRead}
     */
    updateCourseFullCoursesCourseIdPut(courseId, courseCreate, callback) {
      let postBody = courseCreate;
      // verify the required parameter 'courseId' is set
      if (courseId === undefined || courseId === null) {
        throw new Error("Missing the required parameter 'courseId' when calling updateCourseFullCoursesCourseIdPut");
      }
      // verify the required parameter 'courseCreate' is set
      if (courseCreate === undefined || courseCreate === null) {
        throw new Error("Missing the required parameter 'courseCreate' when calling updateCourseFullCoursesCourseIdPut");
      }

      let pathParams = {
        'course_id': courseId
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = ['application/json'];
      let accepts = ['application/json'];
      let returnType = CourseRead;
      return this.apiClient.callApi(
        '/full/courses/{course_id}', 'PUT',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the updateModuleFullModulesModuleIdPut operation.
     * @callback module:api/TeachingApi~updateModuleFullModulesModuleIdPutCallback
     * @param {String} error Error message, if any.
     * @param {module:model/ModuleRead} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Обновить модуль
     * Изменяет название и описание модуля. Доступно только автору курса.
     * @param {Number} moduleId 
     * @param {module:model/ModuleCreate} moduleCreate 
     * @param {module:api/TeachingApi~updateModuleFullModulesModuleIdPutCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/ModuleRead}
     */
    updateModuleFullModulesModuleIdPut(moduleId, moduleCreate, callback) {
      let postBody = moduleCreate;
      // verify the required parameter 'moduleId' is set
      if (moduleId === undefined || moduleId === null) {
        throw new Error("Missing the required parameter 'moduleId' when calling updateModuleFullModulesModuleIdPut");
      }
      // verify the required parameter 'moduleCreate' is set
      if (moduleCreate === undefined || moduleCreate === null) {
        throw new Error("Missing the required parameter 'moduleCreate' when calling updateModuleFullModulesModuleIdPut");
      }

      let pathParams = {
        'module_id': moduleId
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = ['application/json'];
      let accepts = ['application/json'];
      let returnType = ModuleRead;
      return this.apiClient.callApi(
        '/full/modules/{module_id}', 'PUT',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the updateQuestionFullQuestionsQuestionIdPut operation.
     * @callback module:api/TeachingApi~updateQuestionFullQuestionsQuestionIdPutCallback
     * @param {String} error Error message, if any.
     * @param {module:model/QuestionRead} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Обновить вопрос
     * Редактирует текст и сложность вопроса. Доступно только автору курса.
     * @param {Number} questionId 
     * @param {module:model/QuestionCreate} questionCreate 
     * @param {module:api/TeachingApi~updateQuestionFullQuestionsQuestionIdPutCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/QuestionRead}
     */
    updateQuestionFullQuestionsQuestionIdPut(questionId, questionCreate, callback) {
      let postBody = questionCreate;
      // verify the required parameter 'questionId' is set
      if (questionId === undefined || questionId === null) {
        throw new Error("Missing the required parameter 'questionId' when calling updateQuestionFullQuestionsQuestionIdPut");
      }
      // verify the required parameter 'questionCreate' is set
      if (questionCreate === undefined || questionCreate === null) {
        throw new Error("Missing the required parameter 'questionCreate' when calling updateQuestionFullQuestionsQuestionIdPut");
      }

      let pathParams = {
        'question_id': questionId
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = ['application/json'];
      let accepts = ['application/json'];
      let returnType = QuestionRead;
      return this.apiClient.callApi(
        '/full/questions/{question_id}', 'PUT',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the updateTestFullTestsTestIdPut operation.
     * @callback module:api/TeachingApi~updateTestFullTestsTestIdPutCallback
     * @param {String} error Error message, if any.
     * @param {module:model/TestRead} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Обновить тест
     * Редактирует параметры теста и проверяет сохраняемую привязку к курсу или модулю.
     * @param {Number} testId 
     * @param {module:model/TestCreate} testCreate 
     * @param {module:api/TeachingApi~updateTestFullTestsTestIdPutCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/TestRead}
     */
    updateTestFullTestsTestIdPut(testId, testCreate, callback) {
      let postBody = testCreate;
      // verify the required parameter 'testId' is set
      if (testId === undefined || testId === null) {
        throw new Error("Missing the required parameter 'testId' when calling updateTestFullTestsTestIdPut");
      }
      // verify the required parameter 'testCreate' is set
      if (testCreate === undefined || testCreate === null) {
        throw new Error("Missing the required parameter 'testCreate' when calling updateTestFullTestsTestIdPut");
      }

      let pathParams = {
        'test_id': testId
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = ['application/json'];
      let accepts = ['application/json'];
      let returnType = TestRead;
      return this.apiClient.callApi(
        '/full/tests/{test_id}', 'PUT',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the updateTopicContentFullTopicContentsContentIdPut operation.
     * @callback module:api/TeachingApi~updateTopicContentFullTopicContentsContentIdPutCallback
     * @param {String} error Error message, if any.
     * @param {module:model/TopicContentRead} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Обновить материал темы
     * Изменяет описание материала темы. Доступно только автору курса.
     * @param {Number} contentId 
     * @param {module:model/TopicContentCreate} topicContentCreate 
     * @param {module:api/TeachingApi~updateTopicContentFullTopicContentsContentIdPutCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/TopicContentRead}
     */
    updateTopicContentFullTopicContentsContentIdPut(contentId, topicContentCreate, callback) {
      let postBody = topicContentCreate;
      // verify the required parameter 'contentId' is set
      if (contentId === undefined || contentId === null) {
        throw new Error("Missing the required parameter 'contentId' when calling updateTopicContentFullTopicContentsContentIdPut");
      }
      // verify the required parameter 'topicContentCreate' is set
      if (topicContentCreate === undefined || topicContentCreate === null) {
        throw new Error("Missing the required parameter 'topicContentCreate' when calling updateTopicContentFullTopicContentsContentIdPut");
      }

      let pathParams = {
        'content_id': contentId
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = ['application/json'];
      let accepts = ['application/json'];
      let returnType = TopicContentRead;
      return this.apiClient.callApi(
        '/full/topic-contents/{content_id}', 'PUT',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the updateTopicFullTopicsTopicIdPut operation.
     * @callback module:api/TeachingApi~updateTopicFullTopicsTopicIdPutCallback
     * @param {String} error Error message, if any.
     * @param {module:model/TopicRead} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Обновить тему
     * Редактирует название и описание темы. Доступно только автору курса.
     * @param {Number} topicId 
     * @param {module:model/TopicCreate} topicCreate 
     * @param {module:api/TeachingApi~updateTopicFullTopicsTopicIdPutCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/TopicRead}
     */
    updateTopicFullTopicsTopicIdPut(topicId, topicCreate, callback) {
      let postBody = topicCreate;
      // verify the required parameter 'topicId' is set
      if (topicId === undefined || topicId === null) {
        throw new Error("Missing the required parameter 'topicId' when calling updateTopicFullTopicsTopicIdPut");
      }
      // verify the required parameter 'topicCreate' is set
      if (topicCreate === undefined || topicCreate === null) {
        throw new Error("Missing the required parameter 'topicCreate' when calling updateTopicFullTopicsTopicIdPut");
      }

      let pathParams = {
        'topic_id': topicId
      };
      let queryParams = {
      };
      let headerParams = {
      };
      let formParams = {
      };

      let authNames = ['OAuth2PasswordBearer'];
      let contentTypes = ['application/json'];
      let accepts = ['application/json'];
      let returnType = TopicRead;
      return this.apiClient.callApi(
        '/full/topics/{topic_id}', 'PUT',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }


}
