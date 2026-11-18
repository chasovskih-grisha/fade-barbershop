import ukMessages from './messages/uk.json';

type Messages = typeof ukMessages;

declare global {
  interface IntlMessages extends Messages {}
}
