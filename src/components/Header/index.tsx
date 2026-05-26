import { Link } from 'react-router-dom';
import getSiteMetadata from '@/hooks/useSiteMetadata';

const Header = () => {
  const { navLinks } = getSiteMetadata();

  return (
    <>
      <nav className="mx-auto mt-12 flex w-full items-center justify-end px-6 lg:px-16">
        <div className="flex items-center justify-end text-right">
          {navLinks.map((n) => (
            <Link
              key={n.url}
              to={n.url}
              className="mr-3 text-lg lg:mr-4 lg:text-base"
            >
              {n.name}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Header;
