import { IGenericRepository } from '../../../core';
import { User } from '../../../core';
import { UpdateUserDto } from 'src/core/dtos';
import { MemoryDataServices } from './memory-data-services.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { v4 } from 'uuid';

export class MemoryUserRepository<T> implements IGenericRepository<T> {
    
    private _repository:  Map<string, T>;
    public _service: MemoryDataServices;

    constructor() {
        this._repository = new Map();
    }
    
    getAll(): Promise<T[]> {
        return new Promise ((resolve, reject) => {
            const allRec = Array.from(this._repository.values());
            resolve(allRec);
        })
    }

    get(id: string): Promise<T> {
        return new Promise ((resolve, reject) => {
            const user = this._repository.get(id);

            if (user) resolve(user);
            else reject(new NotFoundException('User was not found'));
        })
    }

    create(item: T): Promise<T> {
        return new Promise ((resolve, reject) => {
            const user = item as unknown as User;

            user.id = v4();
            user.version = 1;
            user.createdAt = new Date().getTime();
            user.updatedAt = user.createdAt

            this._repository.set(user.id, item);

            delete user.password;
            
            resolve(item);
        })
    }

    update(id: string, item: any): Promise<T> {
        return new Promise ((resolve, reject) => {
            this.get(id)
            .then( user => {

                const newUser = item as unknown as User;
                const nPassChange = newUser.password.indexOf(' ');
                let newPassword = '';
                let oldPassword = '';

                if (nPassChange > 0) {
                    newPassword = newUser.password.substring(0, nPassChange);
                    oldPassword = newUser.password.substring(nPassChange+1);
                }
               
                const oldUser = user as unknown as User;

                if (oldUser.password != oldPassword) {
                    reject( new ForbiddenException('oldPassword is wrong'));
                }

                oldUser.password = newPassword;
                oldUser.version ++;
                oldUser.updatedAt = new Date().getTime();

                this._repository.set(oldUser.id, oldUser as unknown as T);

                item = oldUser as unknown as T;
        
                delete oldUser.password;

               resolve(item);

            })
            .catch( error => {
                reject( new NotFoundException('User with id does not exist'));

            })
        })
    }

    delete(id: string) {
        return new Promise ((resolve, reject) => {
            const res = this._repository.delete(id);
            if (res) {
                resolve(res);
            }
            else reject( new NotFoundException('User was not found'));
        })
    }
    
}