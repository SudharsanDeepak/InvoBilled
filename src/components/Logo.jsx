import { assets } from "../assets/assets.js";

const Logo = () => {
  return (
    <img className="logo" src={assets.logo} alt="logo" height={150} width={150} />
  );
};

export default Logo;
