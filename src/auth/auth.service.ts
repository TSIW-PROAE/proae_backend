import { SignInDto } from "./dto/signIn.dto";
import { SignupDto } from "./dto/signup.dto";

export interface ISignup {
    signUp(signUpDto: SignupDto): Promise<any>;
    signIn(signInDto: SignInDto): Promise<any>;
}

export interface IUpdatePassword {
    updatePassword(id: number, newPassword: string): Promise<any>;
}