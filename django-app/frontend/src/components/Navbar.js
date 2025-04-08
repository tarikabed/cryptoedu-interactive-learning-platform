import {Link} from "react-router-dom";
import {useEffect, useState} from "react";
import {supabase} from "../supabaseAPI";

const Navbar = () => {
    const [userEmail, setUserEmail] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            const {data: {user}} = await supabase.auth.getUser();
            if (user) setUserEmail(user.email);
        };

        fetchUser();

        const {data: listener} = supabase.auth.onAuthStateChange((_event, session) => {
            setUserEmail(session?.user?.email || null);
        });

        return () => {
            listener?.subscription.unsubscribe();
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUserEmail(null);
        window.location.href = "/"; 
    };

    return (
        <nav style={{ padding: "3px", background: "#333", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <ul style={{ listStyle: "none", display: "flex", gap: "20px", margin: 0 }}>
                <li><Link to="/" style={{ color: "white", textDecoration: "none" }}>Home</Link></li>
                <li><Link to="/trader" style={{ color: "white", textDecoration: "none" }}>Trading</Link></li>
                <li><Link to="/portfolio" style={{ color: "white", textDecoration: "none" }}>Portfolio</Link></li>
                <li><Link to="/friends" style={{ color: "white", textDecoration: "none" }}>Friends</Link></li>
                <li><Link to="/achievements" style={{ color: "white", textDecoration: "none" }}>Achievements</Link></li>

            </ul>
            <div style={{ marginRight: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                {userEmail ? (
                    <>
                        <span>Signed in as <strong>{userEmail}</strong></span>
                        <button onClick={handleLogout} style={{ background: "#555", color: "white", border: "none", padding: "5px 10px", cursor: "pointer" }}>
                            Logout
                        </button>
                    </>
                ) : (
                    <Link to="/login" style={{ color: "white", textDecoration: "none" }}>Login</Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
