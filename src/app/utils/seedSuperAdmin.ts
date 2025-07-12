import { envVars } from "../config/env";
import { IAuthProvider, IUser, Role } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import bcryptjs from "bcryptjs";

export const seedSuperAdmin = async () => {
  try {
    const isSuperAdminExist = await User.findOne({
      email: envVars.SUPER_ADMIN_EMAIL,
    });
    if (isSuperAdminExist) {
      console.log("Super admin already exists.");
      return;
      }
      
      console.log("Seeding super admin...");

      
    const hashedPassword = await bcryptjs.hash(
      envVars.SUPER_ADMIN_PASSWORD,
      Number(envVars.BCRYPT_SALT_ROUNDS)
    );

    const authProvider: IAuthProvider = {
      provider: "credentials",
      providerId: envVars.SUPER_ADMIN_EMAIL,
    };

    const payload: Partial<IUser> = {
      name: "Super Admin",
      email: envVars.SUPER_ADMIN_EMAIL,
      isVerified: true,
      role: Role.SUPER_ADMIN,
      password: hashedPassword,
      auths: [authProvider],
    };

      const superadmin = await User.create(payload);

      console.log("Super admin seeded successfully:", superadmin.email);
      console.log(superadmin);
      
  } catch (error) {
    console.error("Error seeding super admin:", error);
  }
};
