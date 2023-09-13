import { ExternalService, User, UserServices } from 'prisma/prisma-client';
import { gapL, gapM, gapS, gapXs, gray10, gray9 } from '@taskany/colors';
import styled from 'styled-components';
import { Text } from '@taskany/bricks';
import { IconEnvelopeOutline, IconPlusCircleOutline } from '@taskany/icons';

import { PageSep } from '../PageSep';
import { InlineTrigger } from '../InlineTrigger';
import { Link } from '../Link';
import { getDynamicIcon } from '../../utils/getDynamicIcon';

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

const StyledCard = styled.div`
    height: 100%;
`;

type UserContactsProps = {
    user: User;
    userServices: (UserServices & { service: ExternalService })[];
};

export const UserContacts = ({ user, userServices }: UserContactsProps) => {
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
                        <StyledLink target="_blank" href={`mailto:${user?.email}`}>
                            {user?.email}
                        </StyledLink>
                    </div>

                    {userServices.map((userService) => {
                        const Icon = getDynamicIcon(userService.service.icon);
                        return (
                            <div key={`${userService.serviceName}-${userService.serviceId}`}>
                                <Icon size={15} color={gray10} />
                                <StyledLink
                                    target="_blank"
                                    href={`${userService.service.linkPrefix}${userService.serviceId}`}
                                >
                                    {userService.serviceName}
                                </StyledLink>
                            </div>
                        );
                    })}
                    {/* TODO: Link to add to the teams */}
                    <InlineTrigger
                        icon={<IconPlusCircleOutline noWrap size="s" />}
                        text={'Add link'}
                        onClick={() => {}}
                    />
                </StyledInfo>

                <StyledInfo>
                    <Text size="m" color={gray9} weight="bold">
                        Corporate devices
                        <StyledLine />
                    </Text>
                    <InlineTrigger
                        icon={<IconPlusCircleOutline noWrap size="s" />}
                        text={'Request a device'}
                        onClick={() => {}}
                    />
                </StyledInfo>
            </StyledCard>
        </>
    );
};
