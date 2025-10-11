export interface IChat {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userIds: string[];
  users: IUser[];
  messages: IMessage[];
}

export interface IMessage {
  id: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  chatId: string;
  readBy: string[];
  user: IUser;
}

export interface IUser {
  id: string;
  name: string;
  username: string;
  bio: string;
  email: string;
  emailVerified: Date;
  image: string;
  coverImage: string;
  profileImage: string;
  hashedPassword: string;
  createdAt: Date;
  updatedAt: Date;
  followingIds: string[];
  hasNotification: boolean;
  location: string;
  website: string;
  birthday: Date;
}
