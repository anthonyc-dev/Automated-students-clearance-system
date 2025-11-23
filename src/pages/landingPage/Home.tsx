import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Hero = () => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center lg:px-30 justify-center overflow-hidden pt-16 bg-black text-white"
    >
      {/* Gradient background using Tailwind plugin or custom CSS class */}
      <motion.div
        className="absolute inset-0 bg-gradient-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      ></motion.div>

      {/* Background image overlay */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: `url('https://ncmc.edu.ph/img/home_cover.jpg')`,
        }}
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.2 }}
        transition={{ duration: 3, ease: "easeOut" }}
      ></motion.div>

      {/* Floating blurred circles */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      ></motion.div>
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
        animate={{
          y: [0, 20, 0],
          x: [0, -15, 0],
          scale: [1, 0.9, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      ></motion.div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          className="max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.2,
                delayChildren: 0.5,
              },
            },
          }}
        >
          <motion.h1
            className="text-6xl md:text-7xl font-light mb-6 leading-tight"
            variants={{
              hidden: { opacity: 0, y: 50 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.8, ease: "easeOut" },
              },
            }}
          >
            Automated Student
            <motion.span
              className="block bg-gradient-to-r from-white to-blue-500 bg-clip-text text-transparent"
              variants={{
                hidden: { opacity: 0, y: 30, scale: 0.9 },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { duration: 1, ease: "easeOut", delay: 0.2 },
                },
              }}
            >
              Clearance System
            </motion.span>
          </motion.h1>

          <motion.div
            className=" md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto font-light"
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.8, ease: "easeOut" },
              },
            }}
          >
            <p className="text-lg font-light">
              Streamline student clearance, document processing, and
              administrative workflows with our intelligent automation platform.
            </p>
          </motion.div>

          {/* Call to actions */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.8, ease: "easeOut" },
              },
            }}
          >
            {/* Get Started Today Button */}
            <Link to="/login">
              <motion.button
                className="flex items-center justify-center px-6 py-2 bg-white text-black hover:bg-white hover:text-black transition duration-200 rounded-full"
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 10px 25px rgba(255,255,255,0.3)",
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                Login Portal
              </motion.button>
            </Link>
          </motion.div>

          {/* Metrics */}
          <motion.div
            className="mt-12 flex flex-wrap justify-center gap-8 text-white/80"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 1.5,
                },
              },
            }}
          >
            <div className="flex flex-col items-center ">
              {/* Large Avatars */}
              <div className="*:data-[slot=avatar]:ring-background flex -space-x-3 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale mb-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src="/1.jpg" alt="@shadcn" />
                  <AvatarFallback className="text-xl">CN</AvatarFallback>
                </Avatar>
                <Avatar className="w-12 h-12">
                  <AvatarImage src="/2.png" alt="@shadcn" />
                  <AvatarFallback className="text-xl">LR</AvatarFallback>
                </Avatar>
                <Avatar className="w-12 h-12">
                  <AvatarImage src="/3.png" alt="@shadcn" />
                  <AvatarFallback className="text-xl">ER</AvatarFallback>
                </Avatar>
                <Avatar className="w-12 h-12">
                  <AvatarImage src="/4.png" alt="@shadcn" />
                  <AvatarFallback className="text-xl">ER</AvatarFallback>
                </Avatar>
              </div>
              {/* "Teams" label below the avatars */}
              <span className=" tracking-wide text-white drop-shadow-md">
                Teams
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
