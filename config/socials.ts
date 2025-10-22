import { Icons } from "@/components/common/icons";

interface SocialInterface {
  name: string;
  username: string;
  icon: any;
  link: string;
}

export const SocialLinks: SocialInterface[] = [
  {
    name: "Github",
    username: "@PhongLee1210",
    icon: Icons.gitHub,
    link: "https://github.com/PhongLee1210",
  },
  {
    name: "LinkedIn",
    username: "Le Thanh Phong",
    icon: Icons.linkedin,
    link: "https://www.linkedin.com/in/lee-thanh-phong-7013051b7",
  },
  {
    name: "Twitter",
    username: "@phonglee802q",
    icon: Icons.twitter,
    link: "https://x.com/phonglee802q",
  },
  {
    name: "Facebook",
    username: "Phong Lê",
    icon: Icons.facebook,
    link: "https://facebook.com/phong.lethanh.79462",
  },
];
