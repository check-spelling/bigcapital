import { connect } from 'react-redux';
import t from 'store/types';

const mapActionsToProps = (dispatch) => ({
  changePageTitle: (pageTitle) =>
    dispatch({
      type: t.CHANGE_DASHBOARD_PAGE_TITLE,
      pageTitle,
    }),

  changePageSubtitle: (pageSubtitle) =>
    dispatch({
      type: t.ALTER_DASHBOARD_PAGE_SUBTITLE,
      pageSubtitle,
    }),

  changePageHint: (pageHint) => 
    dispatch({
      type: t.CHANGE_DASHBOARD_PAGE_HINT,
      payload: { pageHint }
    }),

  setTopbarEditView: (id) =>
    dispatch({
      type: t.SET_TOPBAR_EDIT_VIEW,
      id,
    }),

  setDashboardRequestLoading: () =>
    dispatch({
      type: t.SET_DASHBOARD_REQUEST_LOADING,
    }),

  setDashboardRequestCompleted: () =>
    dispatch({
      type: t.SET_DASHBOARD_REQUEST_COMPLETED,
    }),

  toggleSidebarExpend: () =>
    dispatch({
      type: t.SIDEBAR_EXPEND_TOGGLE,
    }),

  changePreferencesPageTitle: (pageTitle) => dispatch({
    type: 'CHANGE_PREFERENCES_PAGE_TITLE',
    pageTitle,
  }),
  setSidebarShrink: () => dispatch({
    type: t.SIDEBAR_SHRINK,
  }),
  setSidebarExpand: () => dispatch({
    type: t.SIDEBAR_SHRINK,
  }),
  resetSidebarPreviousExpand: () => dispatch({
    type: t.RESET_SIDEBAR_PREVIOUS_EXPAND,
  }),
  recordSidebarPreviousExpand: () => dispatch({
    type: t.RECORD_SIDEBAR_PREVIOUS_EXPAND,
  }),
});

export default connect(null, mapActionsToProps);
