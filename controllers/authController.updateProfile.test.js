// controllers/authController.updateProfile.test.js
import { updateProfileController } from "./authController.js";
import userModel from "../models/userModel.js";
import { hashPassword } from "../helpers/authHelper.js";

jest.mock("../models/userModel.js");
jest.mock("../helpers/authHelper.js");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnThis();
  res.send = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res;
};

describe("updateProfileController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should reject password shorter than 6 chars", async () => {
    const req = {
      body: {
        password: "123",
      },
      user: { _id: "user123" },
    };
    userModel.findById.mockResolvedValue({
      name: "Old",
      phone: "123",
      address: "old addr",
      password: "oldpass",
    });

    const res = mockRes();

    await updateProfileController(req, res);

    expect(res.json).toHaveBeenCalledWith({
      error: "Passsword is required and 6 character long",
    });
  });

  test("should update profile with existing values when fields missing", async () => {
    const req = {
      body: {
        // gak kirim name atau address
      },
      user: { _id: "user123" },
    };

    userModel.findById.mockResolvedValue({
      name: "Old Name",
      phone: "0811",
      address: "Old Address",
      password: "hashed-old",
    });

    userModel.findByIdAndUpdate.mockResolvedValue({
      _id: "user123",
      name: "Old Name",
      phone: "0811",
      address: "Old Address",
    });

    const res = mockRes();

    await updateProfileController(req, res);

    expect(userModel.findById).toHaveBeenCalledWith("user123");
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "user123",
      {
        name: "Old Name",
        password: "hashed-old",
        phone: "0811",
        address: "Old Address",
      },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Profile Updated SUccessfully",
      })
    );
  });

  test("should update profile and hash password when provided", async () => {
    const req = {
      body: {
        name: "New Name",
        password: "newpass",
        address: "New Addr",
      },
      user: { _id: "user123" },
    };

    userModel.findById.mockResolvedValue({
      name: "Old Name",
      phone: "0811",
      address: "Old Address",
      password: "oldpass",
    });

    hashPassword.mockResolvedValue("hashed-newpass");

    userModel.findByIdAndUpdate.mockResolvedValue({
      _id: "user123",
      name: "New Name",
      address: "New Addr",
      phone: "0811",
    });

    const res = mockRes();

    await updateProfileController(req, res);

    expect(hashPassword).toHaveBeenCalledWith("newpass");
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "user123",
      {
        name: "New Name",
        password: "hashed-newpass",
        phone: "0811",
        address: "New Addr",
      },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
