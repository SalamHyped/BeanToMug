// Initial state
export const initialState = {
  user: null,
  loading: true
};

// Reducer function
export const userReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return {
        user: action.payload,
        loading: false
      };
    case 'LOGOUT':
      return {
        user: null,
        loading: false
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    default:
      return state;
  }
}; 