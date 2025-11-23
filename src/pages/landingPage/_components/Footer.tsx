import { Phone, MapPin, Github, Facebook, Instagram } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { FacebookFilled } from "@ant-design/icons";

const Footer = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.footer
      id="contact"
      className="bg-[#222222]  text-gray-700 lg:px-30"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={containerVariants}
    >
      <div className="container mx-auto px-4 py-16">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
        >
          {/* Brand Section */}
          <motion.div className="space-y-4" variants={itemVariants}>
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2 min-w-fit">
                <img
                  className="h-10 w-10 sm:h-10 sm:w-10 md:h-10 md:w-10 rounded-md object-cover"
                  src="/MICRO FLUX LOGO.png"
                  alt="App logo"
                />

                <span className="text-xl sm:text-2xl font-bold  select-none text-white">
                  ASCS
                </span>
              </div>
            </motion.div>
            <motion.p
              className="text-gray-300 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Transforming educational administration through intelligent
              automation and seamless digital experiences.
            </motion.p>
            <motion.div
              className="flex gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {[
                {
                  icon: Instagram,
                  delay: 0.5,
                  href: "https://www.instagram.com/microflux.official/",
                },
                {
                  icon: Facebook,
                  delay: 0.7,
                  href: "https://www.facebook.com/MicroFluxOfficialPage",
                },
                {
                  icon: Github,
                  delay: 0.6,
                  href: "https://github.com/MicroFluxdev",
                },
              ].map(({ icon: Icon, delay, href }) => (
                <motion.a
                  key={delay}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full hover:bg-blue-100 text-gray-300 hover:text-blue-600 transition flex items-center justify-center"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="h-4 w-4" />
                </motion.a>
              ))}
            </motion.div>
          </motion.div>

          {/* Product Links */}
          <motion.div className="space-y-4" variants={itemVariants}>
            <motion.h3
              className="font-semibold text-white"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              Offers
            </motion.h3>
            <div className="space-y-2">
              {[
                "Enrollment Management System",
                "Compputer Laboratory Logbook",
                "Code Flux",
                "ASCS Mobile App",
                "More",
              ].map((item, index) => (
                <motion.a
                  key={item}
                  className="block text-gray-300 hover:text-blue-600 transition"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  whileHover={{ x: 5, scale: 1.02 }}
                >
                  {item}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Company Links */}
          <motion.div className="space-y-4" variants={itemVariants}>
            <motion.h3
              className="font-semibold text-white"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              Institutions
            </motion.h3>
            <div className="space-y-2">
              {["About Us", "Teams"].map((item, index) => (
                <motion.a
                  key={item}
                  className="block text-gray-300 hover:text-blue-600 transition"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  whileHover={{ x: 5, scale: 1.02 }}
                >
                  {item}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Contact Info */}
          <motion.div className="space-y-4" variants={itemVariants}>
            <motion.h3
              className="font-semibold text-white"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              Contact
            </motion.h3>
            <div className="space-y-3">
              <motion.a
                href="https://www.facebook.com/MicroFluxOfficialPage"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-300"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                whileHover={{ x: 5, scale: 1.02 }}
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <FacebookFilled className="h-4 w-4 text-blue-600" />
                </motion.div>
                <span>MicroFlux</span>
              </motion.a>

              {/* Other contact items */}
              <motion.div
                className="flex items-center gap-3 text-gray-300"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                whileHover={{ x: 5, scale: 1.02 }}
              >
                <Phone className="h-4 w-4 text-blue-600" />
                <span>+639100734410</span>
              </motion.div>

              <motion.div
                className="flex items-center gap-3 text-gray-300"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                whileHover={{ x: 5, scale: 1.02 }}
              >
                <MapPin className="h-4 w-4 text-blue-600" />
                <span>Lanao del Norte, Philippines</span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Separator */}
        <motion.div
          className="my-8 border-t border-gray-500/50"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />

        {/* Footer Bottom */}
        <motion.div
          className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <motion.div
            className="text-gray-300"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            漏 2025 MicroFlu. All rights reserved.
          </motion.div>
          <div className="flex gap-6">
            {["Terms and Policy"].map((item, index) => (
              <motion.a
                key={item}
                href="/TermsPolicy"
                className="text-gray-300 hover:text-blue-600 transition"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                whileHover={{ y: -2, scale: 1.05 }}
              >
                {item}
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default Footer;
