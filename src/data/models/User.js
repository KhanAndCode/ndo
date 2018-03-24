/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import DataType from 'sequelize';
import bcrypt from 'bcrypt-nodejs';
import _ from 'lodash';
import Model from '../sequelize';
import UserLogin from './UserLogin';
import UserProfile from './UserProfile';
import UserClaim from './UserClaim';
import Course from './Course';

const User = Model.define(
  'User',
  {
    id: {
      type: DataType.UUID,
      defaultValue: DataType.UUIDV1,
      primaryKey: true,
    },

    email: {
      type: DataType.STRING(255),
      validate: { isEmail: true },
    },

    emailConfirmed: {
      type: DataType.BOOLEAN,
      defaultValue: false,
    },

    isAdmin: {
      type: DataType.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    indexes: [{ fields: ['email'] }],
  },
);

User.hashPassword = key => bcrypt.hashSync(key, bcrypt.genSaltSync());

User.createUser = function createUser(args) {
  return Model.transaction(t =>
    User.create(
      {
        email: args.email,
        emailConfirmed: false,
        isAdmin: args.isAdmin,
        logins: [{ name: 'local', key: args.email }],
        claims: [
          {
            type: 'local',
            value: User.hashPassword(args.key),
          },
        ],
        profile: {
          displayName: args.name,
          gender: args.gender,
          picture:
            'https://upload.wikimedia.org/wikipedia/commons/d/d3/User_Circle.png',
        },
      },
      {
        include: [
          { model: UserLogin, as: 'logins' },
          { model: UserClaim, as: 'claims' },
          { model: UserProfile, as: 'profile' },
        ],
        transaction: t,
      },
    ),
  );
};

User.prototype.getRole = async courseId => {
  const course = await Course.findById(courseId, {
    where: {
      '$users.Id$': this.id,
    },
    include: [
      {
        model: User,
        as: 'users',
        required: true,
      },
    ],
  });
  return _.get(course, 'users[0].UserCourse.role');
};

export default User;
