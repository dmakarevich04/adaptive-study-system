import ApiClient from "../ApiClient";
import CourseCategoryCreate from '../model/CourseCategoryCreate';
import CourseCategoryRead from '../model/CourseCategoryRead';
import CourseEnrollmentRead from '../model/CourseEnrollmentRead';
import PermissionCreate from '../model/PermissionCreate';
import PermissionRead from '../model/PermissionRead';
import RoleCreate from '../model/RoleCreate';
import RolePermissionCreate from '../model/RolePermissionCreate';
import RolePermissionRead from '../model/RolePermissionRead';
import RoleRead from '../model/RoleRead';
import TestResultRead from '../model/TestResultRead';

/**
* Full service.
* @module api/FullApi
* @version 0.1.0
*/
export default class FullApi {

    /**
    * Constructs a new FullApi. 
    * @alias module:api/FullApi
    * @class
    * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
    * default to {@link module:ApiClient#instance} if unspecified.
    */
    constructor(apiClient) {
        this.apiClient = apiClient || ApiClient.instance;
    }


    /**
     * Callback function to receive the result of the adminDeleteEnrollmentFullAdminEnrollmentsEnrollIdDelete operation.
     * @callback module:api/FullApi~adminDeleteEnrollmentFullAdminEnrollmentsEnrollIdDeleteCallback
     * @param {String} error Error message, if any.
     * @param {Object} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Удалить запись на курс
     * Удаляет запись студента на курс. Доступно только администраторам.
     * @param {Number} enrollId 
     * @param {module:api/FullApi~adminDeleteEnrollmentFullAdminEnrollmentsEnrollIdDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Object}
     */
    adminDeleteEnrollmentFullAdminEnrollmentsEnrollIdDelete(enrollId, callback) {
      let postBody = null;
      // verify the required parameter 'enrollId' is set
      if (enrollId === undefined || enrollId === null) {
        throw new Error("Missing the required parameter 'enrollId' when calling adminDeleteEnrollmentFullAdminEnrollmentsEnrollIdDelete");
      }

      let pathParams = {
        'enroll_id': enrollId
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
        '/full/admin/enrollments/{enroll_id}', 'DELETE',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the adminGetEnrollmentFullAdminEnrollmentsEnrollIdGet operation.
     * @callback module:api/FullApi~adminGetEnrollmentFullAdminEnrollmentsEnrollIdGetCallback
     * @param {String} error Error message, if any.
     * @param {Object} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Получить запись на курс
     * Возвращает данные конкретной записи на курс по идентификатору. Только для администраторов.
     * @param {Number} enrollId 
     * @param {module:api/FullApi~adminGetEnrollmentFullAdminEnrollmentsEnrollIdGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Object}
     */
    adminGetEnrollmentFullAdminEnrollmentsEnrollIdGet(enrollId, callback) {
      let postBody = null;
      // verify the required parameter 'enrollId' is set
      if (enrollId === undefined || enrollId === null) {
        throw new Error("Missing the required parameter 'enrollId' when calling adminGetEnrollmentFullAdminEnrollmentsEnrollIdGet");
      }

      let pathParams = {
        'enroll_id': enrollId
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
        '/full/admin/enrollments/{enroll_id}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the adminGetModulePassedFullAdminModulePassedMpIdGet operation.
     * @callback module:api/FullApi~adminGetModulePassedFullAdminModulePassedMpIdGetCallback
     * @param {String} error Error message, if any.
     * @param {Object} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Получить статус прохождения модуля
     * Возвращает запись о прохождении модуля по идентификатору. Только для администраторов.
     * @param {Number} mpId 
     * @param {module:api/FullApi~adminGetModulePassedFullAdminModulePassedMpIdGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Object}
     */
    adminGetModulePassedFullAdminModulePassedMpIdGet(mpId, callback) {
      let postBody = null;
      // verify the required parameter 'mpId' is set
      if (mpId === undefined || mpId === null) {
        throw new Error("Missing the required parameter 'mpId' when calling adminGetModulePassedFullAdminModulePassedMpIdGet");
      }

      let pathParams = {
        'mp_id': mpId
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
        '/full/admin/module-passed/{mp_id}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the adminListEnrollmentsFullAdminEnrollmentsGet operation.
     * @callback module:api/FullApi~adminListEnrollmentsFullAdminEnrollmentsGetCallback
     * @param {String} error Error message, if any.
     * @param {Object} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Список всех записей на курсы
     * Возвращает все записи студентов на курсы. Доступно только администраторам.
     * @param {module:api/FullApi~adminListEnrollmentsFullAdminEnrollmentsGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Object}
     */
    adminListEnrollmentsFullAdminEnrollmentsGet(callback) {
      let postBody = null;

      let pathParams = {
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
        '/full/admin/enrollments', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the adminListModulePassedFullAdminModulePassedGet operation.
     * @callback module:api/FullApi~adminListModulePassedFullAdminModulePassedGetCallback
     * @param {String} error Error message, if any.
     * @param {Object} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Список статусов прохождения модулей
     * Возвращает все записи о прохождении модулей пользователями. Только для администраторов.
     * @param {module:api/FullApi~adminListModulePassedFullAdminModulePassedGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Object}
     */
    adminListModulePassedFullAdminModulePassedGet(callback) {
      let postBody = null;

      let pathParams = {
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
        '/full/admin/module-passed', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the createCategoryFullAdminCategoriesPost operation.
     * @callback module:api/FullApi~createCategoryFullAdminCategoriesPostCallback
     * @param {String} error Error message, if any.
     * @param {module:model/CourseCategoryRead} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Создать категорию курса
     * Добавляет новую категорию курсов. Требуются права преподавателя.
     * @param {module:model/CourseCategoryCreate} courseCategoryCreate 
     * @param {module:api/FullApi~createCategoryFullAdminCategoriesPostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/CourseCategoryRead}
     */
    createCategoryFullAdminCategoriesPost(courseCategoryCreate, callback) {
      let postBody = courseCategoryCreate;
      // verify the required parameter 'courseCategoryCreate' is set
      if (courseCategoryCreate === undefined || courseCategoryCreate === null) {
        throw new Error("Missing the required parameter 'courseCategoryCreate' when calling createCategoryFullAdminCategoriesPost");
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
      let returnType = CourseCategoryRead;
      return this.apiClient.callApi(
        '/full/admin/categories', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the createPermissionFullAdminPermissionsPost operation.
     * @callback module:api/FullApi~createPermissionFullAdminPermissionsPostCallback
     * @param {String} error Error message, if any.
     * @param {module:model/PermissionRead} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Создать разрешение
     * Добавляет новое действие в систему разрешений. Только для администраторов.
     * @param {module:model/PermissionCreate} permissionCreate 
     * @param {module:api/FullApi~createPermissionFullAdminPermissionsPostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/PermissionRead}
     */
    createPermissionFullAdminPermissionsPost(permissionCreate, callback) {
      let postBody = permissionCreate;
      // verify the required parameter 'permissionCreate' is set
      if (permissionCreate === undefined || permissionCreate === null) {
        throw new Error("Missing the required parameter 'permissionCreate' when calling createPermissionFullAdminPermissionsPost");
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
      let returnType = PermissionRead;
      return this.apiClient.callApi(
        '/full/admin/permissions', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the createRoleFullAdminRolesPost operation.
     * @callback module:api/FullApi~createRoleFullAdminRolesPostCallback
     * @param {String} error Error message, if any.
     * @param {module:model/RoleRead} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Создать роль
     * Добавляет новую роль в систему. Требуются права администратора.
     * @param {module:model/RoleCreate} roleCreate 
     * @param {module:api/FullApi~createRoleFullAdminRolesPostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/RoleRead}
     */
    createRoleFullAdminRolesPost(roleCreate, callback) {
      let postBody = roleCreate;
      // verify the required parameter 'roleCreate' is set
      if (roleCreate === undefined || roleCreate === null) {
        throw new Error("Missing the required parameter 'roleCreate' when calling createRoleFullAdminRolesPost");
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
      let returnType = RoleRead;
      return this.apiClient.callApi(
        '/full/admin/roles', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the createRolePermissionFullAdminRolePermissionsPost operation.
     * @callback module:api/FullApi~createRolePermissionFullAdminRolePermissionsPostCallback
     * @param {String} error Error message, if any.
     * @param {module:model/RolePermissionRead} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Назначить разрешение роли
     * Создает связь между ролью и разрешением. Доступно только администраторам.
     * @param {module:model/RolePermissionCreate} rolePermissionCreate 
     * @param {module:api/FullApi~createRolePermissionFullAdminRolePermissionsPostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/RolePermissionRead}
     */
    createRolePermissionFullAdminRolePermissionsPost(rolePermissionCreate, callback) {
      let postBody = rolePermissionCreate;
      // verify the required parameter 'rolePermissionCreate' is set
      if (rolePermissionCreate === undefined || rolePermissionCreate === null) {
        throw new Error("Missing the required parameter 'rolePermissionCreate' when calling createRolePermissionFullAdminRolePermissionsPost");
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
      let returnType = RolePermissionRead;
      return this.apiClient.callApi(
        '/full/admin/role-permissions', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the deleteCategoryFullAdminCategoriesCatIdDelete operation.
     * @callback module:api/FullApi~deleteCategoryFullAdminCategoriesCatIdDeleteCallback
     * @param {String} error Error message, if any.
     * @param {Object} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Удалить категорию курса
     * Удаляет категорию курсов по идентификатору. Требуются права преподавателя.
     * @param {Number} catId 
     * @param {module:api/FullApi~deleteCategoryFullAdminCategoriesCatIdDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Object}
     */
    deleteCategoryFullAdminCategoriesCatIdDelete(catId, callback) {
      let postBody = null;
      // verify the required parameter 'catId' is set
      if (catId === undefined || catId === null) {
        throw new Error("Missing the required parameter 'catId' when calling deleteCategoryFullAdminCategoriesCatIdDelete");
      }

      let pathParams = {
        'cat_id': catId
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
        '/full/admin/categories/{cat_id}', 'DELETE',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the deletePermissionFullAdminPermissionsPermIdDelete operation.
     * @callback module:api/FullApi~deletePermissionFullAdminPermissionsPermIdDeleteCallback
     * @param {String} error Error message, if any.
     * @param {Object} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Удалить разрешение
     * Удаляет разрешение из системы. Только для администраторов.
     * @param {Number} permId 
     * @param {module:api/FullApi~deletePermissionFullAdminPermissionsPermIdDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Object}
     */
    deletePermissionFullAdminPermissionsPermIdDelete(permId, callback) {
      let postBody = null;
      // verify the required parameter 'permId' is set
      if (permId === undefined || permId === null) {
        throw new Error("Missing the required parameter 'permId' when calling deletePermissionFullAdminPermissionsPermIdDelete");
      }

      let pathParams = {
        'perm_id': permId
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
        '/full/admin/permissions/{perm_id}', 'DELETE',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the deleteRoleFullAdminRolesRoleIdDelete operation.
     * @callback module:api/FullApi~deleteRoleFullAdminRolesRoleIdDeleteCallback
     * @param {String} error Error message, if any.
     * @param {Object} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Удалить роль
     * Удаляет роль из системы. Требуются права администратора.
     * @param {Number} roleId 
     * @param {module:api/FullApi~deleteRoleFullAdminRolesRoleIdDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Object}
     */
    deleteRoleFullAdminRolesRoleIdDelete(roleId, callback) {
      let postBody = null;
      // verify the required parameter 'roleId' is set
      if (roleId === undefined || roleId === null) {
        throw new Error("Missing the required parameter 'roleId' when calling deleteRoleFullAdminRolesRoleIdDelete");
      }

      let pathParams = {
        'role_id': roleId
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
        '/full/admin/roles/{role_id}', 'DELETE',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the deleteRolePermissionFullAdminRolePermissionsRpIdDelete operation.
     * @callback module:api/FullApi~deleteRolePermissionFullAdminRolePermissionsRpIdDeleteCallback
     * @param {String} error Error message, if any.
     * @param {Object} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Удалить назначение разрешения
     * Удаляет связь роли и разрешения. Только для администраторов.
     * @param {Number} rpId 
     * @param {module:api/FullApi~deleteRolePermissionFullAdminRolePermissionsRpIdDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Object}
     */
    deleteRolePermissionFullAdminRolePermissionsRpIdDelete(rpId, callback) {
      let postBody = null;
      // verify the required parameter 'rpId' is set
      if (rpId === undefined || rpId === null) {
        throw new Error("Missing the required parameter 'rpId' when calling deleteRolePermissionFullAdminRolePermissionsRpIdDelete");
      }

      let pathParams = {
        'rp_id': rpId
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
        '/full/admin/role-permissions/{rp_id}', 'DELETE',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the enrollCourseFullCoursesCourseIdEnrollPost operation.
     * @callback module:api/FullApi~enrollCourseFullCoursesCourseIdEnrollPostCallback
     * @param {String} error Error message, if any.
     * @param {module:model/CourseEnrollmentRead} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Записаться на курс
     * Создает запись студента на опубликованный курс.
     * @param {Number} courseId 
     * @param {module:api/FullApi~enrollCourseFullCoursesCourseIdEnrollPostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/CourseEnrollmentRead}
     */
    enrollCourseFullCoursesCourseIdEnrollPost(courseId, callback) {
      let postBody = null;
      // verify the required parameter 'courseId' is set
      if (courseId === undefined || courseId === null) {
        throw new Error("Missing the required parameter 'courseId' when calling enrollCourseFullCoursesCourseIdEnrollPost");
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
      let returnType = CourseEnrollmentRead;
      return this.apiClient.callApi(
        '/full/courses/{course_id}/enroll', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the getCategoryFullAdminCategoriesCatIdGet operation.
     * @callback module:api/FullApi~getCategoryFullAdminCategoriesCatIdGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/CourseCategoryRead} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Получить категорию курса
     * Возвращает категорию по идентификатору или 404, если ее нет.
     * @param {Number} catId 
     * @param {module:api/FullApi~getCategoryFullAdminCategoriesCatIdGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/CourseCategoryRead}
     */
    getCategoryFullAdminCategoriesCatIdGet(catId, callback) {
      let postBody = null;
      // verify the required parameter 'catId' is set
      if (catId === undefined || catId === null) {
        throw new Error("Missing the required parameter 'catId' when calling getCategoryFullAdminCategoriesCatIdGet");
      }

      let pathParams = {
        'cat_id': catId
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
      let returnType = CourseCategoryRead;
      return this.apiClient.callApi(
        '/full/admin/categories/{cat_id}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the getPermissionFullAdminPermissionsPermIdGet operation.
     * @callback module:api/FullApi~getPermissionFullAdminPermissionsPermIdGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/PermissionRead} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Получить разрешение
     * Возвращает разрешение по идентификатору. Только для администраторов.
     * @param {Number} permId 
     * @param {module:api/FullApi~getPermissionFullAdminPermissionsPermIdGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/PermissionRead}
     */
    getPermissionFullAdminPermissionsPermIdGet(permId, callback) {
      let postBody = null;
      // verify the required parameter 'permId' is set
      if (permId === undefined || permId === null) {
        throw new Error("Missing the required parameter 'permId' when calling getPermissionFullAdminPermissionsPermIdGet");
      }

      let pathParams = {
        'perm_id': permId
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
      let returnType = PermissionRead;
      return this.apiClient.callApi(
        '/full/admin/permissions/{perm_id}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the getResultFullResultsResultIdGet operation.
     * @callback module:api/FullApi~getResultFullResultsResultIdGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/TestResultRead} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Получить результат теста
     * Возвращает результат теста, если пользователь — владелец, автор курса или администратор.
     * @param {Number} resultId 
     * @param {module:api/FullApi~getResultFullResultsResultIdGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/TestResultRead}
     */
    getResultFullResultsResultIdGet(resultId, callback) {
      let postBody = null;
      // verify the required parameter 'resultId' is set
      if (resultId === undefined || resultId === null) {
        throw new Error("Missing the required parameter 'resultId' when calling getResultFullResultsResultIdGet");
      }

      let pathParams = {
        'result_id': resultId
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
      let returnType = TestResultRead;
      return this.apiClient.callApi(
        '/full/results/{result_id}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the getRoleFullAdminRolesRoleIdGet operation.
     * @callback module:api/FullApi~getRoleFullAdminRolesRoleIdGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/RoleRead} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Получить роль
     * Возвращает данные роли по идентификатору. Только для администраторов.
     * @param {Number} roleId 
     * @param {module:api/FullApi~getRoleFullAdminRolesRoleIdGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/RoleRead}
     */
    getRoleFullAdminRolesRoleIdGet(roleId, callback) {
      let postBody = null;
      // verify the required parameter 'roleId' is set
      if (roleId === undefined || roleId === null) {
        throw new Error("Missing the required parameter 'roleId' when calling getRoleFullAdminRolesRoleIdGet");
      }

      let pathParams = {
        'role_id': roleId
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
      let returnType = RoleRead;
      return this.apiClient.callApi(
        '/full/admin/roles/{role_id}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the getRolePermissionFullAdminRolePermissionsRpIdGet operation.
     * @callback module:api/FullApi~getRolePermissionFullAdminRolePermissionsRpIdGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/RolePermissionRead} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Получить назначенное разрешение
     * Возвращает конкретную связь роли и разрешения по идентификатору. Только для администраторов.
     * @param {Number} rpId 
     * @param {module:api/FullApi~getRolePermissionFullAdminRolePermissionsRpIdGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/RolePermissionRead}
     */
    getRolePermissionFullAdminRolePermissionsRpIdGet(rpId, callback) {
      let postBody = null;
      // verify the required parameter 'rpId' is set
      if (rpId === undefined || rpId === null) {
        throw new Error("Missing the required parameter 'rpId' when calling getRolePermissionFullAdminRolePermissionsRpIdGet");
      }

      let pathParams = {
        'rp_id': rpId
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
      let returnType = RolePermissionRead;
      return this.apiClient.callApi(
        '/full/admin/role-permissions/{rp_id}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the listCategoriesFullAdminCategoriesGet operation.
     * @callback module:api/FullApi~listCategoriesFullAdminCategoriesGetCallback
     * @param {String} error Error message, if any.
     * @param {Array.<module:model/CourseCategoryRead>} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Получить категории курсов
     * Возвращает постраничный список категорий курсов.
     * @param {Object} opts Optional parameters
     * @param {Number} [limit = 100)] 
     * @param {Number} [offset = 0)] 
     * @param {module:api/FullApi~listCategoriesFullAdminCategoriesGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Array.<module:model/CourseCategoryRead>}
     */
    listCategoriesFullAdminCategoriesGet(opts, callback) {
      opts = opts || {};
      let postBody = null;

      let pathParams = {
      };
      let queryParams = {
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
      let returnType = [CourseCategoryRead];
      return this.apiClient.callApi(
        '/full/admin/categories', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the listPermissionsFullAdminPermissionsGet operation.
     * @callback module:api/FullApi~listPermissionsFullAdminPermissionsGetCallback
     * @param {String} error Error message, if any.
     * @param {Array.<module:model/PermissionRead>} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Список разрешений
     * Возвращает все зарегистрированные разрешения. Только для администраторов.
     * @param {module:api/FullApi~listPermissionsFullAdminPermissionsGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Array.<module:model/PermissionRead>}
     */
    listPermissionsFullAdminPermissionsGet(callback) {
      let postBody = null;

      let pathParams = {
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
      let returnType = [PermissionRead];
      return this.apiClient.callApi(
        '/full/admin/permissions', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the listRolePermissionsFullAdminRolePermissionsGet operation.
     * @callback module:api/FullApi~listRolePermissionsFullAdminRolePermissionsGetCallback
     * @param {String} error Error message, if any.
     * @param {Array.<module:model/RolePermissionRead>} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Список назначенных разрешений
     * Возвращает все связи ролей и разрешений. Только для администраторов.
     * @param {module:api/FullApi~listRolePermissionsFullAdminRolePermissionsGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Array.<module:model/RolePermissionRead>}
     */
    listRolePermissionsFullAdminRolePermissionsGet(callback) {
      let postBody = null;

      let pathParams = {
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
      let returnType = [RolePermissionRead];
      return this.apiClient.callApi(
        '/full/admin/role-permissions', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the listRolesFullAdminRolesGet operation.
     * @callback module:api/FullApi~listRolesFullAdminRolesGetCallback
     * @param {String} error Error message, if any.
     * @param {Array.<module:model/RoleRead>} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Список ролей
     * Возвращает все доступные роли. Только для администраторов.
     * @param {module:api/FullApi~listRolesFullAdminRolesGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Array.<module:model/RoleRead>}
     */
    listRolesFullAdminRolesGet(callback) {
      let postBody = null;

      let pathParams = {
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
      let returnType = [RoleRead];
      return this.apiClient.callApi(
        '/full/admin/roles', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the myResultsFullResultsGet operation.
     * @callback module:api/FullApi~myResultsFullResultsGetCallback
     * @param {String} error Error message, if any.
     * @param {Array.<module:model/TestResultRead>} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Мои результаты тестов
     * Возвращает результаты тестов для текущего пользователя.
     * @param {module:api/FullApi~myResultsFullResultsGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Array.<module:model/TestResultRead>}
     */
    myResultsFullResultsGet(callback) {
      let postBody = null;

      let pathParams = {
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
        '/full/results', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the submitTestFullTestsTestIdSubmitPost operation.
     * @callback module:api/FullApi~submitTestFullTestsTestIdSubmitPostCallback
     * @param {String} error Error message, if any.
     * @param {Object} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Сдать тест
     * Принимает ответы пользователя, проверяет их и сохраняет результат попытки.
     * @param {Number} testId 
     * @param {Object.<String, {String: Object}>} requestBody 
     * @param {module:api/FullApi~submitTestFullTestsTestIdSubmitPostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Object}
     */
    submitTestFullTestsTestIdSubmitPost(testId, requestBody, callback) {
      let postBody = requestBody;
      // verify the required parameter 'testId' is set
      if (testId === undefined || testId === null) {
        throw new Error("Missing the required parameter 'testId' when calling submitTestFullTestsTestIdSubmitPost");
      }
      // verify the required parameter 'requestBody' is set
      if (requestBody === undefined || requestBody === null) {
        throw new Error("Missing the required parameter 'requestBody' when calling submitTestFullTestsTestIdSubmitPost");
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
      let returnType = Object;
      return this.apiClient.callApi(
        '/full/tests/{test_id}/submit', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the unenrollCourseFullCoursesCourseIdEnrollDelete operation.
     * @callback module:api/FullApi~unenrollCourseFullCoursesCourseIdEnrollDeleteCallback
     * @param {String} error Error message, if any.
     * @param {Object} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Отменить запись на курс
     * Удаляет запись студента на курс, если она существует.
     * @param {Number} courseId 
     * @param {module:api/FullApi~unenrollCourseFullCoursesCourseIdEnrollDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link Object}
     */
    unenrollCourseFullCoursesCourseIdEnrollDelete(courseId, callback) {
      let postBody = null;
      // verify the required parameter 'courseId' is set
      if (courseId === undefined || courseId === null) {
        throw new Error("Missing the required parameter 'courseId' when calling unenrollCourseFullCoursesCourseIdEnrollDelete");
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
        '/full/courses/{course_id}/enroll', 'DELETE',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the updateCategoryFullAdminCategoriesCatIdPut operation.
     * @callback module:api/FullApi~updateCategoryFullAdminCategoriesCatIdPutCallback
     * @param {String} error Error message, if any.
     * @param {module:model/CourseCategoryRead} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Обновить категорию курса
     * Изменяет название существующей категории. Требуются права преподавателя.
     * @param {Number} catId 
     * @param {module:model/CourseCategoryCreate} courseCategoryCreate 
     * @param {module:api/FullApi~updateCategoryFullAdminCategoriesCatIdPutCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/CourseCategoryRead}
     */
    updateCategoryFullAdminCategoriesCatIdPut(catId, courseCategoryCreate, callback) {
      let postBody = courseCategoryCreate;
      // verify the required parameter 'catId' is set
      if (catId === undefined || catId === null) {
        throw new Error("Missing the required parameter 'catId' when calling updateCategoryFullAdminCategoriesCatIdPut");
      }
      // verify the required parameter 'courseCategoryCreate' is set
      if (courseCategoryCreate === undefined || courseCategoryCreate === null) {
        throw new Error("Missing the required parameter 'courseCategoryCreate' when calling updateCategoryFullAdminCategoriesCatIdPut");
      }

      let pathParams = {
        'cat_id': catId
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
      let returnType = CourseCategoryRead;
      return this.apiClient.callApi(
        '/full/admin/categories/{cat_id}', 'PUT',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the updatePermissionFullAdminPermissionsPermIdPut operation.
     * @callback module:api/FullApi~updatePermissionFullAdminPermissionsPermIdPutCallback
     * @param {String} error Error message, if any.
     * @param {module:model/PermissionRead} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Обновить разрешение
     * Изменяет действие существующего разрешения. Только для администраторов.
     * @param {Number} permId 
     * @param {module:model/PermissionCreate} permissionCreate 
     * @param {module:api/FullApi~updatePermissionFullAdminPermissionsPermIdPutCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/PermissionRead}
     */
    updatePermissionFullAdminPermissionsPermIdPut(permId, permissionCreate, callback) {
      let postBody = permissionCreate;
      // verify the required parameter 'permId' is set
      if (permId === undefined || permId === null) {
        throw new Error("Missing the required parameter 'permId' when calling updatePermissionFullAdminPermissionsPermIdPut");
      }
      // verify the required parameter 'permissionCreate' is set
      if (permissionCreate === undefined || permissionCreate === null) {
        throw new Error("Missing the required parameter 'permissionCreate' when calling updatePermissionFullAdminPermissionsPermIdPut");
      }

      let pathParams = {
        'perm_id': permId
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
      let returnType = PermissionRead;
      return this.apiClient.callApi(
        '/full/admin/permissions/{perm_id}', 'PUT',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the updateRoleFullAdminRolesRoleIdPut operation.
     * @callback module:api/FullApi~updateRoleFullAdminRolesRoleIdPutCallback
     * @param {String} error Error message, if any.
     * @param {module:model/RoleRead} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Обновить роль
     * Изменяет название роли. Доступно только администраторам.
     * @param {Number} roleId 
     * @param {module:model/RoleCreate} roleCreate 
     * @param {module:api/FullApi~updateRoleFullAdminRolesRoleIdPutCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/RoleRead}
     */
    updateRoleFullAdminRolesRoleIdPut(roleId, roleCreate, callback) {
      let postBody = roleCreate;
      // verify the required parameter 'roleId' is set
      if (roleId === undefined || roleId === null) {
        throw new Error("Missing the required parameter 'roleId' when calling updateRoleFullAdminRolesRoleIdPut");
      }
      // verify the required parameter 'roleCreate' is set
      if (roleCreate === undefined || roleCreate === null) {
        throw new Error("Missing the required parameter 'roleCreate' when calling updateRoleFullAdminRolesRoleIdPut");
      }

      let pathParams = {
        'role_id': roleId
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
      let returnType = RoleRead;
      return this.apiClient.callApi(
        '/full/admin/roles/{role_id}', 'PUT',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }

    /**
     * Callback function to receive the result of the updateRolePermissionFullAdminRolePermissionsRpIdPut operation.
     * @callback module:api/FullApi~updateRolePermissionFullAdminRolePermissionsRpIdPutCallback
     * @param {String} error Error message, if any.
     * @param {module:model/RolePermissionRead} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Обновить назначение разрешения
     * Изменяет связь между ролью и разрешением. Только для администраторов.
     * @param {Number} rpId 
     * @param {module:model/RolePermissionCreate} rolePermissionCreate 
     * @param {module:api/FullApi~updateRolePermissionFullAdminRolePermissionsRpIdPutCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/RolePermissionRead}
     */
    updateRolePermissionFullAdminRolePermissionsRpIdPut(rpId, rolePermissionCreate, callback) {
      let postBody = rolePermissionCreate;
      // verify the required parameter 'rpId' is set
      if (rpId === undefined || rpId === null) {
        throw new Error("Missing the required parameter 'rpId' when calling updateRolePermissionFullAdminRolePermissionsRpIdPut");
      }
      // verify the required parameter 'rolePermissionCreate' is set
      if (rolePermissionCreate === undefined || rolePermissionCreate === null) {
        throw new Error("Missing the required parameter 'rolePermissionCreate' when calling updateRolePermissionFullAdminRolePermissionsRpIdPut");
      }

      let pathParams = {
        'rp_id': rpId
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
      let returnType = RolePermissionRead;
      return this.apiClient.callApi(
        '/full/admin/role-permissions/{rp_id}', 'PUT',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, null, callback
      );
    }


}
