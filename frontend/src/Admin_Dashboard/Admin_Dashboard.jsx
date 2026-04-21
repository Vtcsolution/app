import { useState } from 'react';
import Dashboard_Navbar from './Admin_Navbar';
import Doctor_Side_Bar from './SideBar';
import DashboardPage from './DashboardComponents';

const Admin_Dashboard = () => {
    const [side, setSide] = useState(false); // Sidebar state
    
    const user = {
        name:"User",
        email:"user@gmail.com",
        profile:"https://avatars.mds.yandex.net/i?id=93f523ab7f890b9175f222cd947dc36ccbd81bf7-9652646-images-thumbs&n=13"
    }

  return (
    <div className="min-h-screen bg-[#F5F3EB]">
      <Dashboard_Navbar side={side} setSide={setSide} user={user}/>
      <div className="dashboard-wrapper flex pt-16">
        <Doctor_Side_Bar side={side} setSide={setSide} user={user}/>
        <div className="dashboard-side flex-1 ml-0 lg:ml-64 p-4 md:p-6 lg:p-8">       
          <DashboardPage/>
        </div>
      </div>
    </div>
  )
}

export default Admin_Dashboard