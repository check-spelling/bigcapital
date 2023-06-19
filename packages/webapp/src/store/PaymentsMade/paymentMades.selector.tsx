// @ts-nocheck
import { isEqual } from 'lodash';

import { paginationLocationQuery } from '@/store/selectors';
import { createDeepEqualSelector } from '@/utils';
import { defaultTableQuery } from './paymentMades.reducer';

const paymentMadesTableStateSelector = (state) => state.paymentMades.tableState;

// Get payments made table state marged with location query.
export const getPaymentMadesTableStateFactory = () =>
  createDeepEqualSelector(
    paginationLocationQuery,
    paymentMadesTableStateSelector,
    (locationQuery, tableState) => {
      return {
        ...locationQuery,
        ...tableState,
      };
    },
  );

export const paymentsTableStateChangedFactory = () =>
  createDeepEqualSelector(paymentMadesTableStateSelector, (tableState) => {
    return !isEqual(tableState, defaultTableQuery);
  });
