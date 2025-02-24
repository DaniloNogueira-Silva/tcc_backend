import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.schema';
import { UserPayload } from 'src/auth/auth.service';
import { SchoolUser } from 'src/school_user/school_user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,

    @InjectModel(SchoolUser.name)
    private schoolUserModel: Model<SchoolUser>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true });
  }

  async remove(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id);
  }

  async getUsersByRole(userPayload: UserPayload): Promise<any> {
    const userRole = userPayload.role;
    const userSchool = userPayload?.school_id;
    if (userRole === 'MASTER') {
      return await this.userModel.find().exec();
    }

    if (userRole === 'ADMIN') {
      const schoolUsers = await this.schoolUserModel
        .find({ school_id: userSchool })
        .exec();

      let users: any[] = [];
      for (const schoolUser of schoolUsers) {
        const user = await this.userModel.findById(schoolUser.user_id).exec();
        users.push(user);
      }

      return users;
    }

    if (userRole === 'DEFAULT') {
      return await this.userModel.findById(userPayload.id).exec();
    }
  }
}
