import { Request, Response } from "express";
import { getCustomRepository } from "typeorm";
import { SurveysRepository } from "../repositories/SurveysRepository";
import { SurveysUsersRepository } from "../repositories/SurveysUsersRepository";
import { UsersRepository } from "../repositories/UsersRepository";
import SendMailService from "../services/SendMailService";
import { resolve } from "path";

class SendMailController {
    async execute(req: Request, res: Response) {
        const { email, survey_id } = req.body;

        const userRepository = getCustomRepository(UsersRepository);
        const surveyRepository = getCustomRepository(SurveysRepository);
        const surveysUsersRepositorys = getCustomRepository(SurveysUsersRepository);

        const user =  await userRepository.findOne({email});
        if(!user){
            return res.status(400).json({erro: "Users does not exists!"});
        }

        const survey = await surveyRepository.findOne({id: survey_id});
        if(!survey){
            return res.status(400).json({erro: "Surveys does not exists!"});
        }


        const npsPath = resolve(__dirname, "..", "views", "emails", "npsMail.hbs");

        const variables = {
            name: user.name,
            title: survey.title,
            description: survey.description,
            user_id: user.id,
            link: process.env.URL_MAIL
        }

        const surveyUserAlreadyExists = await surveysUsersRepositorys.findOne({
            where: [{user_id: user.id}, {value: null}],
            relations: ["user", "survey"]
        });

        if(surveyUserAlreadyExists){
            await SendMailService.execute(email, survey.title, variables, npsPath);
            return res.json(surveyUserAlreadyExists);
        }

        const surveyUser = surveysUsersRepositorys.create({
            user_id: user.id,
            survey_id
        }); 

        await surveysUsersRepositorys.save(surveyUser);

        await SendMailService.execute(email,survey.title, variables, npsPath);

        return res.json(surveyUser);

    }
}

export { SendMailController };
