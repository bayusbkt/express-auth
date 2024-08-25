import UserModel from "../models/userModels.js";
import validateEmail from "../utils/emailValidator.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const getUser = async (req, res) => {
  try {
    const id = req.query.id;
    if (id) {
      const userById = await UserModel.findByPk(id);
      if (!userById) {
        return res.status(404).json({
          status: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        status: true,
        message: "Success to Get User",
        data: userById,
      });
    }

    const users = await UserModel.findAll({
      attributes: ["id", "name", "email"],
    });
    return res.status(200).json({
      status: true,
      message: "Succes to Get All User",
      data: users,
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: error.message,
    });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name) throw { message: "Please Input Username" };
    if (!email) throw { message: "Please Input Email" };
    if (!password) throw { message: "Please Input Password" };

    if (!validateEmail(email)) throw { message: "Invalid Email Format" };

    const existingUser = await UserModel.findOne({ where: { email } });
    if (existingUser) throw { message: "Email is already in use" };

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      refresh_token: null,
    });

    return res.status(201).json({
      status: true,
      message: "User Registered Successfully",
      data: newUser,
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ where: { email } });
    if (user.length == 0) throw { message: "User Not Found" };

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw { message: "Password Incorrect" };

    const name = user.name;
    const accessToken = jwt.sign(
      { name, email, password },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "30s",
      }
    );

    const refreshToken = jwt.sign(
      { name, email, password },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "1h",
      }
    );

    await UserModel.update(
      { refresh_token: refreshToken },
      {
        where: {
          id: user.id,
        },
      }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000,
    });

    return res.status(200).json({
      status: true,
      message: "Login Successful",
      token: accessToken,
    });
  } catch (error) {
    return res.status(401).json({
      status: false,
      message: error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.sendStatus(401);

    const user = await UserModel.findOne({
      where: { refresh_token: refreshToken },
    });
    if (!user) return res.sendStatus(403);

    const userId = user.id;
    await UserModel.update({ refresh_token: null }, { where: { id: userId } });
    res.clearCookie("refreshToken");
    return res.sendStatus(200);
  } catch (error) {
    return res.status(401).json({
      status: false,
      message: error.message,
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.sendStatus(401);

    const user = await UserModel.findOne({
      where: { refresh_token: refreshToken },
    });
    if (!user) return res.sendStatus(403);

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decode) => {
        if (err) return res.sendStatus(403);
        const userId = user.id;
        const name = user.name;
        const email = user.email;
        const accessToken = jwt.sign(
          { userId, name, email },
          process.env.ACCESS_TOKEN_SECRET,
          {
            expiresIn: "30s",
          }
        );

        res.status(200).json({
          status: true,
          message: "Success Renew Token",
          token: accessToken,
        });
      }
    );
  } catch (error) {
    return res.status(401).json({
      status: false,
      message: error.message,
    });
  }
};
