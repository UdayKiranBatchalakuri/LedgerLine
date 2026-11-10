import api from "./api";

export const getAccounts = async () => {
  const response = await api.get("/accounts");
  return response.data.accounts;
};

export const createAccount = async (payload) => {
  const accountType =
    typeof payload === "string" ? payload : payload?.accountType || payload?.type;

  const response = await api.post("/accounts", {
    accountType,
  });

  return response.data;
};