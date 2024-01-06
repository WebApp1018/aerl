import { useNavigate, useParams } from 'react-router-dom';
import { Input, Button } from '@nextui-org/react';

export default function Connect() {

    let { ssid } = useParams();
    const navigate = useNavigate();

    return (
        <div className="p-5">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-black dark:text-white">
                    Please enter the password for "{ssid}"
                </h2>
                <p className='my-2 text-black dark:text-white text-center'>This network requires a password to connect. Please enter it below.</p>
                <Input type="password" variant="flat" label="Password" className='my-10' />

                <div className="flex justify-between">
                    <Button size='lg' color="default" className='w-6/12 mr-2' onPress={() => {navigate('/setup/wifi/scan')}}>
                        Cancel
                    </Button>
                <Button size="lg" color="primary" className="w-6/12" onPress={() => {navigate('/')}}>
                    Connect
                </Button>
            </div>

            </div>

        </div>
    )
}