export default class WttrError extends Error {
  constructor(publicMessage, details) {
    super('WttrError');
    this.publicMessage = publicMessage;
    this.details = details;
  }
}
