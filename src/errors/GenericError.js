export default class GenericError extends Error {
  constructor(publicMessage, details) {
    super(publicMessage);
    this.publicMessage = publicMessage;
    this.details = details;
  }
}
