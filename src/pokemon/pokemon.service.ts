import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';
import { Model, isValidObjectId } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PokemonService {

  private defaultLimit:number;

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    private readonly configService:ConfigService
  ) {
    this.defaultLimit = configService.get<number>('defaultLimit');
  }

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();
    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch (error) {
      this.handleExceptions(error);
    }

  }

  async findAll(paginationDto:PaginationDto) {
    const {limit=this.defaultLimit, offset=0}=paginationDto;
    return await this.pokemonModel.find()
      .limit(limit)
      .skip(offset)
      .sort({
        no:1
      })
      .select('-__v')
  }

  async findOne(termino: string) {
    let pokemon: Pokemon;

    if (!isNaN(+termino)) {
      pokemon = await this.pokemonModel.findOne({ no: termino })
    }

    if (isValidObjectId(termino)) {
      pokemon = await this.pokemonModel.findById(termino)
    }

    if (!pokemon) {
      pokemon = await this.pokemonModel.findOne({ name: termino.toLocaleLowerCase().trim() });
    }

    if (!pokemon) throw new NotFoundException(`El pokemon no existe, ${termino}`);
    return pokemon;
  }

  async update(termino: string, updatePokemonDto: UpdatePokemonDto) {

    try {
      let pokemon = await this.findOne(termino);

      if (updatePokemonDto.name) {
        updatePokemonDto.name = updatePokemonDto.name.toLocaleLowerCase();
      }
      await pokemon.updateOne(updatePokemonDto, { new: true });

      return { ...pokemon.toJSON(), ...updatePokemonDto };
    } catch (error) {
      this.handleExceptions(error);
    }


  }

  async remove(termino:string) {
    //const resultado = await this.pokemonModel.findByIdAndDelete(termino);
    const {deletedCount} = await this.pokemonModel.deleteOne({_id:termino});
    if(deletedCount===0) throw new BadRequestException(`El pokemon con ${termino} no existe!!`);

    return {msg:'Registro eliminado!!'};
  }

  private handleExceptions(error:any){
    if (error.code === 11000) {
      throw new BadRequestException(`El registro ya existe!!`);
    }
    throw new InternalServerErrorException(`Error al crear el registro en el servidor`);
  }
}
