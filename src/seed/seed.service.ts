import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model} from 'mongoose';

import { PokemonResponse } from './interfaces/poke-response.interface';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';

@Injectable()
export class SeedService {

  

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    private readonly http:AxiosAdapter
  ) { }

  /**
   * Forma lenta de insertar datos 
   * @returns array pokemons
   */
  async executeSeedLenta(){
    await this.pokemonModel.deleteMany({});//delete * from pokemon
    const data = await this.http.get<PokemonResponse>('https://pokeapi.co/api/v2/pokemon?offset=10&limit=10"');

    data.results.forEach(async({name, url})=>{
      const segments =  url.split('/');
      const no =  +segments[segments.length-2];
      await this.pokemonModel.create({name,no});
    })
    return 'Seed Executed';
  }

  async executeSeedMedia(){
    await this.pokemonModel.deleteMany({});//delete * from pokemon
    const data = await this.http.get<PokemonResponse>('https://pokeapi.co/api/v2/pokemon?limit=10"');

    const insertPromisesArray=[];

    data.results.forEach(async({name, url})=>{
      const segments =  url.split('/');
      const no =  +segments[segments.length-2];
      insertPromisesArray.push(
        this.pokemonModel.create({name,no})
      );
    });

    await Promise.all(insertPromisesArray);
    return 'Seed Executed';
  }


  /**
   * FORMA OPTIMA DE INSERTAR CANTIDADES DE REGISTROS EN LA BASE DE DATOS 
   * 
   * @returns list pokemons
   */
  async executeSeed(){
    await this.pokemonModel.deleteMany({});//delete * from pokemon
    const data = await this.http.get<PokemonResponse>('https://pokeapi.co/api/v2/pokemon?limit=200"');

    const insertPromisesArray:{name:string,no:number}[]=[];

    data.results.forEach(({name, url})=>{
      const segments =  url.split('/');
      const no =  +segments[segments.length-2];
      insertPromisesArray.push({name,no});
    });

    await this.pokemonModel.insertMany(insertPromisesArray);
    return 'Seed Executed';
  }

}
