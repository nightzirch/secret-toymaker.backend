let isValidAPIToken = (apitoken) => {
  if(apitoken) {
    return apitoken.match(/^([0-9A-Z]){8}-([0-9A-Z]){4}-([0-9A-Z]){4}-([0-9A-Z]){4}-([0-9A-Z]){20}-([0-9A-Z]){4}-([0-9A-Z]){4}-([0-9A-Z]){4}-([0-9A-Z]){12}$/g);
  }
  return false;
};

let isValidEmail = (email) => {
  if(email) {
    return email.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/ig);
  }
  return false;
}

isValidNotes = (notes) => {
  if(notes) {
    return notes.length > 10;
  }
  return false;
}

module.exports = {
  validateAPIToken: (apitoken) => {
    return isValidAPIToken(apitoken);
  },

  validateEmail: (email) => {
    return isValidEmail(email);
  },

  validateNotes: (notes) => {
    return isValidNotes(notes);
  },

  validateParticipant: (apitoken, email, notes) => {
    return isValidAPIToken(apitoken) && isValidEmail(email) && isValidNotes(notes);
  }
};
