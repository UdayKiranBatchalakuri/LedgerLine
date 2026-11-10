import api from "./api";

export const getTransactions = async (
  accountId,
  {
    page = 1,
    limit = 10,
    type = "",
    startDate = "",
    endDate = "",
  } = {}
) => {
  const params = { page, limit };

  if (type) params.type = type;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const response = await api.get(
    `/transactions/account/${accountId}`,
    { params }
  );

  return response.data;
};

export const getTransactionById = async (transactionId) => {
  const response = await api.get(`/transactions/${transactionId}`);
  return response.data;
};

export const depositMoney = async ({
  accountId,
  amountPaise,
  description,
  idempotencyKey,
}) => {
  const response = await api.post(
    "/transactions/deposit",
    {
      accountId,
      amountPaise,
      description,
    },
    {
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    }
  );

  return response.data;
};

export const withdrawMoney = async ({
  accountId,
  amountPaise,
  description,
  idempotencyKey,
}) => {
  const response = await api.post(
    "/transactions/withdraw",
    {
      accountId,
      amountPaise,
      description,
    },
    {
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    }
  );

  return response.data;
};

export const transferMoney = async ({
  sourceAccountId,
  destinationAccountId,
  amountPaise,
  description,
  idempotencyKey,
}) => {
  const response = await api.post(
    "/transactions/transfer",
    {
      sourceAccountId,
      destinationAccountId,
      amountPaise,
      description,
    },
    {
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    }
  );

  return response.data;
};
