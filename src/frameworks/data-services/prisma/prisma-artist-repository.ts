import { PrismaDataServices } from './prisma-data-services.service';
import { PrismaService } from './prisma-client.service';
import { Artist } from '@prisma/client' 
import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 } from 'uuid';

@Injectable()
export class PrismaArtistRepository {
    
    public _service: PrismaDataServices; 

    constructor(private prisma: PrismaService) {};
    
    getAll(): Promise<Artist[]> {
        return new Promise ((resolve, reject) => {
            const allRec =  this.prisma.artist.findMany()
            resolve(allRec);
        })
    };

    get(id: string): Promise<Artist> {
        return new Promise ((resolve, reject) => {
            const artist = this.prisma.artist.findUnique({
                where: {
                    id: id,
                }
            });

            if (artist) resolve(artist);
            else reject(new NotFoundException('Artist was not found'));
        })
    };

    create(item: Artist): Promise<Artist> {
        return new Promise ((resolve, reject) => {
            const artist = item as unknown as Artist;

            artist.id = v4();

            const user = this.prisma.artist.create( {
                data: {
                    id: artist.id,
                    name: artist.id,
                    grammy: artist.grammy
                } 
            });

            console.log('Artist create: ', user, item);
    
            resolve(item);
        })
    };

    update(id: string, item: Artist): Promise<Artist> {
        return new Promise ((resolve, reject) => {
            this.get(id)
            .then( artist => {

                const newArtist = item as unknown as Artist;
                newArtist.id = id;

                this.prisma.artist.updateMany({
                    where: {
                        id: newArtist.id,
                    },
                    data: {
                        name: newArtist.name,
                        grammy: newArtist.grammy
                    }
                }) //.set(newArtist.id, item);
        
                resolve(item);

            })
            .catch( error => {
                reject( new NotFoundException('Artist with id does not exist'));

            })
        })
    };

    delete(id: string) {
        return new Promise ((resolve, reject) => {
            const res = this.prisma.artist.delete({
                where: {
                    id: id,
                }
            }) //delete(id);
            resolve(res);

            if (res) {

                this._service.track.deleteLinkToArtist(id)
                .then( (res) => {
                    const next = res;
//                    console.log('Artist delete track reference: ', id, res)
                })

                this._service.album.deleteLinkToArtist(id)
                .then( (res) => {
                    const next = res;
//                    console.log('Artist delete album reference: ', id, res)
                })

                this._service.favorites.deleteArtist(id)
                .then( (artist) => {
                    const next = res;
//                    console.log('delete artist from favorites: ', id, artist)
                })
                .catch( (error) => {
                    const next = res;
//                    console.log('not found artist in favorites: ', id)
                })

                resolve(res);
            }
            else reject( new NotFoundException('Artist was not found'));
    
        })
    };
    
}