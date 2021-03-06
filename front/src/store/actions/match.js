import axios from 'axios';
import { push } from 'connected-react-router';
import { message } from 'antd';
import moment from 'moment';
import * as actionTypes from './actionTypes';
import { categories, getCategoryName } from '../staticData/categories';

import { generateQuery } from '../tools/functions';

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFTOKEN';

export const errorHandler = error => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    message.error('Error!');
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    message.error('No response from server.');
  } else {
    // Something happened in setting up the request that triggered an Error
    message.error('Failed to set up request.');
  }
};

const getMatchAction = match => {
  return { type: actionTypes.GET_MATCH, match };
};

export const getMatch = id => {
  return dispatch => {
    return axios
      .get(`/api/match/${id}/`)
      .then(async res => {
        const { data } = res;
        const { restrictedGender } = data;
        delete data.restrictedGender;
        const indexes = await JSON.parse(data.category.indexes);
        const matchInfo = {
          ...data,
          timeBegin: moment(data.timeBegin),
          timeEnd: moment(data.timeEnd),
          restrictToMale: data.isGenderRestricted && !restrictedGender,
          restrictToFemale: data.isGenderRestricted && restrictedGender,
          isPeriodic: data.period !== 0,
          category: indexes,
          categoryName: getCategoryName(indexes),
        };
        dispatch(getMatchAction(matchInfo));
      })
      .catch(error => {
        errorHandler(error);
        dispatch(push('/home'));
      });
  };
};

const getHotMatchAction = hot => {
  return { type: actionTypes.GET_HOT_MATCH, hot };
};

export const getHotMatch = () => {
  return dispatch => {
    return axios
      .get('/api/match/hot/')
      .then(res => dispatch(getHotMatchAction(res.data)))
      .catch(errorHandler);
  };
};

const getNewMatchAction = newMatches => {
  return { type: actionTypes.GET_NEW_MATCH, newMatches };
};

export const getNewMatch = () => {
  return dispatch => {
    return axios
      .get('/api/match/new/')
      .then(res => dispatch(getNewMatchAction(res.data)))
      .catch(errorHandler);
  };
};

const getRecommendMatchAction = recommend => {
  return { type: actionTypes.GET_RECOMMEND_MATCH, recommend };
};

export const getRecommendMatch = () => {
  return dispatch => {
    return axios
      .get(`/api/match/recommend/`)
      .then(res => dispatch(getRecommendMatchAction(res.data)))
      .catch(errorHandler);
  };
};

const createMatchAction = () => {
  return {
    type: actionTypes.CREATE_MATCH,
  };
};

const config = {
  headers: {
    'content-type': 'multipart/form-data',
  },
};

export const createMatch = match => {
  const formData = new FormData();
  Object.keys(match).forEach(key => formData.append(key, match[key]));

  return dispatch => {
    return axios
      .post(`/api/match/`, formData, config)
      .then(res => {
        dispatch(createMatchAction());
        dispatch(push(`/match/${res.data.id}`));
      })
      .catch(errorHandler);
  };
};

const CToACallback = (acc, ctgn) => {
  const { ctgs, array } = acc;
  const target = ctgs.filter(obj => obj.label === ctgn)[0];
  return { ctgs: target.children, array: array.concat([target.value]) };
};

const convertCategoryToArray = string => {
  if (!string) return null;
  const splited = string.substring(1).split('/');

  const result = splited.reduce(CToACallback, { ctgs: categories, array: [] });
  const { array } = result;
  if (result.ctgs) return array.concat([0]);
  return array;
};

const sendNlpTextAction = (category, location, title, nlpText) => {
  return {
    type: actionTypes.SEND_NLP_TEXT,
    category: convertCategoryToArray(category),
    locationText: location,
    title,
    additionalInfo: nlpText,
  };
};

export const sendNlpText = nlpText => {
  return dispatch => {
    return axios
      .post(`/api/match/nlp/`, { nlpText })
      .then(res => {
        dispatch(
          sendNlpTextAction(
            res.data.categories[0].name,
            res.data.locations[0].name,
            res.data.events[0].name,
            nlpText,
          ),
        );
        dispatch(push(`/match/create`));
      })
      .catch(errorHandler);
  };
};

const editMatchAction = () => {
  return {
    type: actionTypes.EDIT_MATCH,
  };
};

export const editMatch = (id, match) => {
  const formData = new FormData();
  Object.keys(match).forEach(key => formData.append(key, match[key]));

  return dispatch => {
    return axios
      .post(`/api/match/${id}/`, formData, config)
      .then(() => {
        dispatch(editMatchAction());
        dispatch(push(`/match/${id}`));
      })
      .catch(errorHandler);
  };
};

const joinMatchAction = id => {
  return { type: actionTypes.JOIN_MATCH, id };
};

export const joinMatch = id => {
  return dispatch => {
    return axios
      .post(`/api/match/${id}/join/`)
      .then(() => dispatch(joinMatchAction(id)))
      .catch(errorHandler);
  };
};

const quitMatchAction = id => {
  return { type: actionTypes.QUIT_MATCH, id };
};

export const quitMatch = id => {
  return dispatch => {
    return axios
      .delete(`/api/match/${id}/join/`)
      .then(() => dispatch(quitMatchAction(id)))
      .catch(errorHandler);
  };
};

const searchMatchAction = searchResult => {
  return { type: actionTypes.SEARCH_MATCH, searchResult };
};

export const searchMatch = (query, category) => {
  const parameter = generateQuery(query, category);
  return dispatch => {
    return axios
      .get(`/api/match/search${parameter}`)
      .then(res => dispatch(searchMatchAction(res.data)))
      .catch(errorHandler);
  };
};
