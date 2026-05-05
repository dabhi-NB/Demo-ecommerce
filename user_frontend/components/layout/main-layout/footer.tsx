import React from "react";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className=" py-6 px-15 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
      <div className="text-center md:text-left">
        ©{currentYear}, made by{" "}
        <a href="/" target="_blank" className="font-medium text-blue-600">
          Next
        </a>
      </div>

      <div className="hidden md:flex space-x-4">
        <a
          href="/page/termscondition"
          target="_blank"
          className="text-blue-600 hover:underline"
        >
          Terms & Condition
        </a>

        <a href="/page/privacypolicy" className="text-blue-600 hover:underline">
          Privacy Policy
        </a>
      </div>
    </footer>
  );
};

export default Footer;
