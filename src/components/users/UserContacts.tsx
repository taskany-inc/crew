import { gapL, gapM, gapS, gapXs, gray10, gray9 } from '@taskany/colors';
import styled from 'styled-components';
import { Link, Text } from '@taskany/bricks';
import {
    IconEnvelopeOutline,
    IconGithubOutline,
    IconGitlabOutline,
    IconPlusCircleOutline,
    IconTelegramOutline,
} from '@taskany/icons';

import { User } from '../../api-client/users/user-types';
import { PageSep } from '../PageSep';
import { InlineTrigger } from '../InlineTrigger';

const StyledInfo = styled.div`
    display: grid;
    grid-template-columns: 6fr;
    gap: ${gapS};
    &:last-child {
        gap: ${gapS};
    }
    margin: ${gapS} 0 ${gapL} ${gapM};
`;

const StyledLine = styled(PageSep)`
    white-space: nowrap;
    margin: ${gapXs} 0px;
    width: 300px;
`;

const StyledLink = styled(Link)`
    color: ${gray10};
    margin-left: ${gapS};
    font-size: 14px;
`;

const StyledText = styled(Text)`
    color: ${gray10};
    font-size: 14px;
`;

const StyledCard = styled.div`
    height: 100%;
`;

type UserContactsProps = {
    user: User;
    showDevices?: boolean;
};

export const UserContacts = ({ user, showDevices = false }: UserContactsProps) => {
    return (
        <>
            <StyledCard>
                <StyledInfo>
                    <Text size="m" color={gray9} weight="bold">
                        Contacts
                        <StyledLine />
                    </Text>
                    <div>
                        <IconEnvelopeOutline size={15} color={gray10} />
                        <StyledLink inline target="_blank" href={`mailto:${user?.email}`}>
                            {user?.email}
                        </StyledLink>
                    </div>
                    {user?.telegram && (
                        <div>
                            <IconTelegramOutline size={15} color={gray10} />
                            <StyledLink inline target="_blank" href={`https://t.me/${user.telegram}`}>
                                {user.telegram}
                            </StyledLink>
                        </div>
                    )}
                    {user?.gitlab && (
                        <div>
                            <IconGitlabOutline size={15} color={gray10} />
                            <StyledLink inline target="_blank" href={user?.gitlab?.web_url}>
                                {user.gitlab?.username}
                            </StyledLink>
                        </div>
                    )}
                    {user?.github && (
                        <div>
                            <IconGithubOutline size={15} color={gray10} />
                            <StyledLink inline target="_blank" href={`https://github.com/${user.github}`}>
                                {user.github}
                            </StyledLink>
                        </div>
                    )}
                    {/* TODO: Link to add to the teams */}
                    <InlineTrigger
                        icon={<IconPlusCircleOutline noWrap size="s" />}
                        text={'Add link'}
                        onClick={() => {}}
                    />
                </StyledInfo>

                <StyledInfo>
                    {showDevices && (
                        <>
                            {user.devices.length > 0 && (
                                <>
                                    <Text size="m" color={gray9} weight="bold">
                                        Corporate devices
                                        <StyledLine />
                                    </Text>
                                    {user?.devices.map((device) => (
                                        <StyledText weight="bolder" color={gray10} size="s" key={device.deviceId}>
                                            {device?.name}
                                            <Text
                                                as="span"
                                                size="s"
                                                weight="regular"
                                                color={gray10}
                                                key={device.deviceId}
                                            >
                                                {' '}
                                                {device?.deviceId}
                                            </Text>
                                        </StyledText>
                                    ))}
                                    {/* TODO: inline form for devices */}
                                    <InlineTrigger
                                        icon={<IconPlusCircleOutline noWrap size="s" />}
                                        text={'Request a device'}
                                        onClick={() => {}}
                                    />
                                </>
                            )}
                        </>
                    )}
                </StyledInfo>
            </StyledCard>
        </>
    );
};
