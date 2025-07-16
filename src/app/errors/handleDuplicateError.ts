import { IGenericErrorResponse } from "../interfaces/error";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const handleDuplicateError = (err: any): IGenericErrorResponse => {
  // Extract value within double quotes using regex
  const matchedArray = err.message.match(/"([^"]*)"/);
  //* const matchedArray = err.message.match(/"([^"]*)"/);
  //* message = `${matchedArray[1]} already exists!`;
  // const extractedMessage = matchedArray && matchedArray[1];

  // const message = `${Object.values(err.keyValue)[0]} already exists!`;

  const statusCode = 400;
  return {
    statusCode,
    message: `${matchedArray && matchedArray[1]} already exists!`,
  };
};
