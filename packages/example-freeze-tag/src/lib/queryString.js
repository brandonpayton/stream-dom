export default {
  parse: function (queryStr) {
    queryStr[0] === '?' && (queryStr = queryStr.substr(1));
    
    return queryStr.split('&').reduce((result, keyValuePair) => {
      let [ key, value ] = keyValuePair.split('=').map(decodeURIComponent);
      
      if (key in result) {
        let existingValue = result[key];
        if (Array.isArray(existingValue)) {
          existingValue.push(value);
        }
        else {
          result[key] = [ existingValue, value ];
        }
      }
      else {
        result[key] = value;
      }
      
      return result;
    }, {});
  },
  stringify: function (query) {
    function stringifyKeyValue(key, value) {
      return Array.isArray(value)
        ? value.map(subValue => stringifyKeyValue(key, subValue)).join('&')
        : `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    }
    
    let keys = Object.keys(query);
    
    return keys.length === 0
      ? ''
      : keys.map(key => stringifyKeyValue(key, query[key])).join('&');
  }
};