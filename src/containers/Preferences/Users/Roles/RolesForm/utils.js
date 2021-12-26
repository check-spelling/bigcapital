import { chain } from 'lodash';
import * as R from 'ramda';
import {
  getPermissionsSchemaService,
  getPermissionsSchemaServices,
} from 'common/permissionsSchema';

export const FULL_ACCESS_CHECKBOX_STATE = {
  INDETARMINE: -1,
  ON: true,
  OFF: false,
};

/**
 * Transformes the permissions object to array.
 * @returns
 */
export const transformToArray = ({ permissions }) => {
  return Object.keys(permissions).map((index) => {
    const [value, key] = index.split('/');

    return {
      subject: value,
      ability: key,
      value: permissions[index],
    };
  });
};

function transformPermissions(permissions) {
  return Object.keys(permissions).map((permissionKey) => {
    const [subject, key] = permissionKey.split('/');
    const value = permissions[permissionKey];

    return { key, subject, value };
  });
}

/**
 * Transformes permissions array to object.
 * @param {*} permissions -
 * @returns
 */
export const transformPermissionsToObject = (permissions) => {
  const output = {};
  permissions.forEach((item) => {
    output[`${item.subject}/${item.ability}`] = !!item.value;
  });
  return output;
};

/**
 *
 * @param {*} role
 * @returns
 */
export const transformToObject = (role) => {
  const permissions = transformPermissionsToObject(role.permissions);
  const serviceFullAccess = getInitialServicesFullAccess(permissions);

  return {
    role_name: role.name,
    role_description: role.description,
    permissions,
    serviceFullAccess,
  };
};

export const getDefaultValuesFromSchema = (schema) => {
  return schema
    .map((item) => {
      const abilities = [
        ...(item.abilities || []),
        ...(item.extra_abilities || []),
      ];
      return abilities
        .filter((ability) => ability.default)
        .map((ability) => ({
          subject: item.subject,
          ability: ability.key,
          value: ability.default,
        }));
    })
    .flat();
};

/**
 * Retrieve initial values of full access services.
 * @param {*} formPermissions
 * @returns
 */
export const getInitialServicesFullAccess = (formPermissions) => {
  const services = getPermissionsSchemaServices();

  return chain(services)
    .map((service) => {
      const { subject } = service;
      const isFullChecked = isServiceFullChecked(subject, formPermissions);
      const isFullUnchecked = isServiceFullUnchecked(subject, formPermissions);
      const value = detarmineCheckboxState(isFullChecked, isFullUnchecked);

      return [service.subject, value];
    })
    .fromPairs()
    .value();
};

/**
 *
 * @param {*} schema
 * @returns
 */
export const getNewRoleInitialValues = (schema) => {
  const permissions = transformPermissionsToObject(
    getDefaultValuesFromSchema(schema),
  );
  const serviceFullAccess = getInitialServicesFullAccess(permissions);

  return {
    permissions,
    serviceFullAccess,
  };
};

/**
 *
 * @param {*} service
 * @param {*} columnKey
 * @returns
 */
export function getSerivceColumnPermission(service, columnKey) {
  return service.permissions.find((permission) => {
    return permission.relatedColumn === columnKey;
  });
}

/**
 *
 * @param {*} service
 * @returns
 */
export function getServiceExtraPermissions(service) {
  return service.permissions.filter((permission) => {
    return !permission.relatedColumn;
  });
}

/**
 * Detarmines the given service subject is full permissions checked.
 */
export function isServiceFullChecked(subject, permissions) {
  const serviceSchema = getPermissionsSchemaService(subject);

  return serviceSchema.permissions.every(
    (permission) => permissions[`${subject}/${permission.key}`],
  );
}

/**
 * Detarmines the given service subject is fully associated permissions unchecked.
 * @param {string} subject -
 * @param {Object} permissionsMap -
 */
export function isServiceFullUnchecked(subject, permissionsMap) {
  const serviceSchema = getPermissionsSchemaService(subject);

  return serviceSchema.permissions.every(
    (permission) => !permissionsMap[`${subject}/${permission.key}`],
  );
}

/**
 * Handles permission checkbox change.
 */
export const handleCheckboxPermissionChange = R.curry(
  (form, permission, service, event) => {
    const { subject } = service;
    const isChecked = event.currentTarget.checked;
    const newValues = {
      ...form.values,
      permissions: {
        ...form.values.permissions,
        [`${subject}/${permission.key}`]: isChecked,
      },
    };
    const isFullChecked = isServiceFullChecked(subject, newValues.permissions);
    const isFullUnchecked = isServiceFullUnchecked(
      subject,
      newValues.permissions,
    );
    form.setFieldValue(`permissions.${subject}/${permission.key}`, isChecked);
    form.setFieldValue(
      `serviceFullAccess.${subject}`,
      detarmineCheckboxState(isFullChecked, isFullUnchecked),
    );
  },
);

/**
 * Detarmines the permission checkbox state.
 * @param {boolean} isFullChecked
 * @param {boolean} isFullUnchecked
 * @returns {FULL_ACCESS_CHECKBOX_STATE}
 */
function detarmineCheckboxState(isFullChecked, isFullUnchecked) {
  return isFullChecked
    ? FULL_ACCESS_CHECKBOX_STATE.ON
    : isFullUnchecked
    ? FULL_ACCESS_CHECKBOX_STATE.OFF
    : FULL_ACCESS_CHECKBOX_STATE.INDETARMINE;
}

/**
 * Retreive the service all permissions paths.
 * @param {string} subject
 * @returns {string[]}
 */
export function getServiceAllPermissionsPaths(subject) {
  const service = getPermissionsSchemaService(subject);

  return service.permissions.map(
    (perm) => `permissions.${subject}/${perm.key}`,
  );
}

/**
 * Handle full access service checkbox change.
 */
export const handleCheckboxFullAccessChange = R.curry(
  (service, form, event) => {
    const isChecked = event.currentTarget.checked;
    const permsPaths = getServiceAllPermissionsPaths(service.subject);

    form.setFieldValue(`serviceFullAccess.${service.subject}`, isChecked);

    permsPaths.forEach((permissionPath) => {
      form.setFieldValue(
        permissionPath,
        isChecked
          ? FULL_ACCESS_CHECKBOX_STATE.ON
          : FULL_ACCESS_CHECKBOX_STATE.OFF,
      );
    });
  },
);
